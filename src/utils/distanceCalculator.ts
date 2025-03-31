/**
 * Utility functions for calculating distance and delivery fees
 */

// Business location (Koh Samui)
const BUSINESS_LOCATION = { lat: 9.751085, lng: 99.975936 };

/**
 * Calculate the distance between two points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Radius of the Earth in kilometers
  const R = 6371;
  
  // Convert latitude and longitude from degrees to radians
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  // Haversine formula
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  
  return distance;
}

/**
 * Convert degrees to radians
 * @param deg Degrees
 * @returns Radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

/**
 * Calculate delivery fee based on distance
 * @param distance Distance in kilometers
 * @returns Delivery fee in THB
 */
export function calculateDeliveryFee(distance: number): number {
  // Define delivery fee tiers
  if (distance <= 5) return 50;      // 0-5 km = 50 THB
  if (distance <= 10) return 100;    // 5-10 km = 100 THB
  if (distance <= 15) return 150;    // 10-15 km = 150 THB
  if (distance <= 20) return 200;    // 15-20 km = 200 THB
  if (distance <= 30) return 300;    // 20-30 km = 300 THB
  if (distance <= 50) return 500;    // 30-50 km = 500 THB
  return 800;                        // Over 50 km = 800 THB
}

/**
 * Calculate distance from business location
 * @param lat Customer latitude
 * @param lng Customer longitude
 * @returns Distance in kilometers
 */
export function calculateDistanceFromBusiness(lat: number, lng: number): number {
  return calculateDistance(
    BUSINESS_LOCATION.lat,
    BUSINESS_LOCATION.lng,
    lat,
    lng
  );
}
