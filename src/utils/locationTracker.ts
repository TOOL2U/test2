/**
 * Utility for tracking driver location and calculating distances
 */
import { calculateDistance } from './distanceCalculator';
import { GpsCoordinates } from '../context/OrderContext';

// Define types
interface LocationWatcherOptions {
  onLocationUpdate: (position: GeolocationPosition) => void;
  onError: (error: GeolocationPositionError) => void;
  updateInterval?: number; // in milliseconds
  highAccuracy?: boolean;
}

interface LocationTracker {
  watchId: number | null;
  isTracking: boolean;
  lastPosition: GeolocationPosition | null;
  start: () => Promise<boolean>;
  stop: () => void;
  getCurrentPosition: () => Promise<GeolocationPosition>;
}

/**
 * Create a location tracker that watches for position changes
 * @param options Configuration options for the location tracker
 * @returns LocationTracker object
 */
export function createLocationTracker(options: LocationWatcherOptions): LocationTracker {
  const {
    onLocationUpdate,
    onError,
    updateInterval = 10000, // Default: update every 10 seconds
    highAccuracy = true
  } = options;
  
  let watchId: number | null = null;
  let isTracking = false;
  let lastPosition: GeolocationPosition | null = null;
  let updateIntervalId: number | null = null;
  
  // Check if geolocation is available
  const isGeolocationAvailable = (): boolean => {
    return 'geolocation' in navigator;
  };
  
  // Get current position as a promise
  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!isGeolocationAvailable()) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          lastPosition = position;
          resolve(position);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };
  
  // Start tracking location
  const start = async (): Promise<boolean> => {
    if (!isGeolocationAvailable()) {
      onError({
        code: 2, // POSITION_UNAVAILABLE
        message: 'Geolocation is not supported by this browser.',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      });
      return false;
    }
    
    if (isTracking) {
      return true; // Already tracking
    }
    
    try {
      // Get initial position
      const initialPosition = await getCurrentPosition();
      lastPosition = initialPosition;
      onLocationUpdate(initialPosition);
      
      // Start watching position
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          lastPosition = position;
          onLocationUpdate(position);
        },
        onError,
        {
          enableHighAccuracy: highAccuracy,
          timeout: 10000,
          maximumAge: 0
        }
      );
      
      // Set up interval for forced updates if needed
      if (updateInterval > 0) {
        updateIntervalId = window.setInterval(() => {
          getCurrentPosition()
            .then(onLocationUpdate)
            .catch(onError);
        }, updateInterval);
      }
      
      isTracking = true;
      return true;
    } catch (error) {
      if (error instanceof GeolocationPositionError) {
        onError(error);
      } else {
        onError({
          code: 2, // POSITION_UNAVAILABLE
          message: error instanceof Error ? error.message : 'Unknown error',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3
        });
      }
      return false;
    }
  };
  
  // Stop tracking location
  const stop = (): void => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    
    if (updateIntervalId !== null) {
      clearInterval(updateIntervalId);
      updateIntervalId = null;
    }
    
    isTracking = false;
  };
  
  return {
    get watchId() { return watchId; },
    get isTracking() { return isTracking; },
    get lastPosition() { return lastPosition; },
    start,
    stop,
    getCurrentPosition
  };
}

/**
 * Calculate if a location is within a certain distance of another location
 * @param location1 First GPS coordinates
 * @param location2 Second GPS coordinates
 * @param thresholdKm Distance threshold in kilometers
 * @returns Boolean indicating if locations are within threshold distance
 */
export function isWithinDistance(
  location1: GpsCoordinates,
  location2: GpsCoordinates,
  thresholdKm: number
): boolean {
  if (!location1 || !location2) return false;
  
  const distance = calculateDistance(
    location1.latitude,
    location1.longitude,
    location2.latitude,
    location2.longitude
  );
  
  return distance <= thresholdKm;
}

/**
 * Convert GeolocationPosition to GpsCoordinates
 * @param position Browser geolocation position
 * @returns GpsCoordinates object
 */
export function positionToCoordinates(position: GeolocationPosition): GpsCoordinates {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude
  };
}
