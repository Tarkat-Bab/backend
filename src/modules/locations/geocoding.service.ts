import axios, { AxiosError } from 'axios';

interface NominatimResponse {
  display_name: string;
  address: {
    road?: string;
    city?: string;
    country?: string;
    [key: string]: string | undefined;
  };
}

interface GeocodingCache {
  [key: string]: {
    value: string;
    timestamp: number;
  }
}

export class GeocodingError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'GeocodingError';
  }
}

export class GeocodingService {
  private readonly cache: GeocodingCache = {};
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_RETRIES = 3;
  private lastRequestTime = 0;

  private validateCoordinates(latitude: number, longitude: number): void {
    if (latitude < -90 || latitude > 90) {
      throw new GeocodingError('Invalid latitude. Must be between -90 and 90');
    }
    if (longitude < -180 || longitude > 180) {
      throw new GeocodingError('Invalid longitude. Must be between -180 and 180');
    }
  }

  private getCacheKey(latitude: number, longitude: number): string {
    return `${latitude},${longitude}`;
  }

  private async throttleRequest(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < 1000) { // Ensure 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  async getLocationName(latitude: number, longitude: number): Promise<string> {
    this.validateCoordinates(latitude, longitude);
    
    const cacheKey = this.getCacheKey(latitude, longitude);
    const cached = this.cache[cacheKey];
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value;
    }

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        await this.throttleRequest();
        
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ar`;
        const response = await axios.get<NominatimResponse>(url, {
          headers: {
            'User-Agent': 'TarketBabApp/1.0'
          }
        });

        const locationName = response.data.display_name;
        this.cache[cacheKey] = {
          value: locationName,
          timestamp: Date.now()
        };

        return locationName;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (error instanceof AxiosError && error.response?.status === 429) {
          // Rate limit hit, wait longer before retry
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
          continue;
        }
        
        if (attempt === this.MAX_RETRIES) {
          throw new GeocodingError(
            'Failed to fetch location name',
            lastError
          );
        }
      }
    }

    throw new GeocodingError('Failed to fetch location name', lastError);
  }
}
