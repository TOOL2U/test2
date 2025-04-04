/**
 * Utility for calculating distances between coordinates
 */

/**
 * Calculate distance between two points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

/**
 * Convert degrees to radians
 * @param deg Degrees
 * @returns Radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate distance from business location to customer
 * @param customerLat Customer latitude
 * @param customerLon Customer longitude
 * @returns Distance in kilometers
 */
export function calculateDistanceFromBusiness(customerLat: number, customerLon: number): number {
  // Business location (Koh Samui, Thailand)
  const businessLat = 9.751085;
  const businessLon = 99.975936;
  
  return calculateDistance(businessLat, businessLon, customerLat, customerLon);
}

/**
 * Calculate delivery fee based on distance
 * @param distance Distance in kilometers
 * @returns Delivery fee in THB
 */
export function calculateDeliveryFee(distance: number): number {
  // Base fee
  let fee = 50;
  
  // Add 10 THB per km after first 5km
  if (distance > 5) {
    fee += Math.ceil(distance - 5) * 10;
  }
  
  // Cap at 200 THB
  return Math.min(fee, 200);
}

/**
 * Calculate estimated delivery time based on distance
 * @param distance Distance in kilometers
 * @returns Estimated delivery time in minutes
 */
export function calculateEstimatedDeliveryTime(distance: number): number {
  // Base time: 15 minutes preparation
  const baseTime = 15;
  
  // Add 2 minutes per km
  const travelTime = Math.ceil(distance) * 2;
  
  // Add buffer time based on distance
  let bufferTime = 5;
  if (distance > 10) {
    bufferTime = 10;
  } else if (distance > 20) {
    bufferTime = 15;
  }
  
  return baseTime + travelTime + bufferTime;
}

/**
 * Format distance for display
 * @param distance Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    // Convert to meters for small distances
    const meters = Math.round(distance * 1000);
    return `${meters} m`;
  }
  
  // Round to 1 decimal place for larger distances
  return `${distance.toFixed(1)} km`;
}
