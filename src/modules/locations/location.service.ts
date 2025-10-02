import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class LocationService {
  constructor(private dataSource: DataSource) {}

  /**
   * Method to store longitude and latitude - replaces PostGIS Point
   */
  createPoint(longitude: number, latitude: number): { longitude: number, latitude: number } {
    return { longitude, latitude };
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
   * Save entity location (example for users/technicals/requests)
   * Pass the repository + entity to update
   */
  async saveLocation(
    repository: any,
    entity: any,
    longitude: number,
    latitude: number,
  ): Promise<any> {
    entity.longitude = longitude;
    entity.latitude = latitude;
    return repository.save(entity);
  }
}
