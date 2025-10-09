import axios, { AxiosError } from 'axios';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
@Injectable()
export class LocationService {
  constructor(private dataSource: DataSource) {}

  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
  private readonly apiKey = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyDoO2pGRP3Fd0uzgb0i0MyhM0TRJhpWdTY';

  /**
   * Fetch address details in both Arabic and English for given coordinates
   */
  async geolocationAddress(latitude: number, longitude: number): Promise<{
    latitude: number;
    longitude: number;
    ar_address: string;
    en_address: string;
  }> {
    const params = `latlng=${latitude},${longitude}&key=${this.apiKey}`;

    try {
      const [arResponse, enResponse] = await Promise.all([
        axios.get(`${this.baseUrl}?${params}&language=ar`),
        axios.get(`${this.baseUrl}?${params}&language=en`)
      ]);

      const arResult = arResponse.data.results?.[0];
      const enResult = enResponse.data.results?.[0];

      return {
        latitude,
        longitude,
        ar_address: arResult?.formatted_address || 'العنوان غير متاح',
        en_address: enResult?.formatted_address || 'Address not available'
      };
    } catch (error) {
      this.handleAxiosError(error, 'Error fetching geolocation');
    }
  }

  /**
   * Get latitude and longitude for a given address text
   */
  async getLatLongFromText(address: string, lang: string = 'en'): Promise<{
    latitude: number;
    longitude: number;
    ar_address: string;
    en_address: string;
  }> {
    const requestUrl = `${this.baseUrl}?address=${encodeURIComponent(address)}&key=${this.apiKey}&language=${lang}`;

    try {
      const { data } = await axios.get(requestUrl);
      const result = data.results?.[0];

      if (!result) throw new Error('No geocoding results found.');

      const { lat: latitude, lng: longitude } = result.geometry.location;

      // Reuse geolocationAddress for consistent structure
      const addressDetails = await this.geolocationAddress(latitude, longitude);

      console.log('🌍 Geocoding URL:', requestUrl);
      console.log('📍 Coordinates:', { latitude, longitude });

      return addressDetails;
    } catch (error) {
      this.handleAxiosError(error, 'Error fetching coordinates from text');
    }
  }

  /**
   * Calculate distance between two points (using Haversine formula)
   * Returns distance in kilometers
   */
  calculateDistance(
    longitude1: number,
    latitude1: number,
    longitude2: number,
    latitude2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(latitude2 - latitude1);
    const dLon = this.toRad(longitude2 - longitude1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(latitude1)) * Math.cos(this.toRad(latitude2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }
  
  // Helper function to convert degrees to radians
  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  /**
   * Find nearest rows from a given table
   * @param entityRepository - TypeORM repository to query from
   * @param longitude - User's longitude
   * @param latitude - User's latitude
   * @param limit - number of results
   */
  async findNearest(
    entityRepository: any,
    longitude: number,
    latitude: number,
    limit = 5,
  ): Promise<any[]> {
    // Get all relevant entities
    const entities = await entityRepository.find({
      where: { 
        deleted: false 
      },
      select: ['id', 'username', 'latitude', 'longitude'],
    });
    
    // Calculate distance for each entity
    const entitiesWithDistance = entities.map(entity => {
      const distance = this.calculateDistance(
        longitude, 
        latitude, 
        entity.longitude, 
        entity.latitude
      );
      return {
        ...entity,
        distance
      };
    });
    
    // Sort by distance and limit results
    entitiesWithDistance.sort((a, b) => a.distance - b.distance);
    return entitiesWithDistance.slice(0, limit);
  }


  /**
  * Centralized Axios error handler
  */
  private handleAxiosError(error: unknown, context: string): never {
    if (error instanceof AxiosError) {
      console.error(`${context}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.error_message || 'Geocoding request failed');
    }
    console.error(`${context}:`, error);
    throw error;
  }
}
