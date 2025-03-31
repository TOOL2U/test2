import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { 
  ArrowLeft, 
  MapPin, 
  Play, 
  Square, 
  AlertTriangle, 
  CheckCircle, 
  Truck,
  RefreshCw,
  Package,
  Phone
} from 'lucide-react';

export default function DriverTrackingPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const staffCode = searchParams.get('code');
  const { getOrderById, updateDriverLocation } = useOrders();
  
  // State for tracking
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number; lng: number} | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  
  // Refs
  const watchIdRef = useRef<number | null>(null);
  const mapRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const updateCountRef = useRef<number>(0);
  
  // Check if we have a valid order and staff code
  useEffect(() => {
    if (!orderId) {
      setError("No order ID provided. Please go back and select an order.");
      return;
    }
    
    if (!staffCode) {
      setError("No staff code provided. Authentication required.");
      return;
    }
    
    // Simple validation - in production this would be more secure
    const validCodes = ['DRIVER123', 'DRIVER456', 'OWNER789', 'ADMIN123'];
    if (validCodes.includes(staffCode)) {
      setAuthenticated(true);
    } else {
      setError("Invalid staff code. Please use a valid code to access this system.");
    }
  }, [orderId, staffCode]);
  
  // Load Google Maps API
  useEffect(() => {
    if (!authenticated || !orderId) return;
    
    if (!window.google && !document.getElementById('google-maps-script')) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDRDTFpVwaAjihQ1SLUuCeZLuIRhBj4seY&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      // Define the callback function globally
      window.initMap = () => {
        console.log("Google Maps API loaded");
        setMapLoaded(true);
      };
      
      // Add error handling for the script
      script.onerror = () => {
        console.error("Failed to load Google Maps API");
        setError("Failed to load Google Maps. Please try again later.");
      };
      
      document.head.appendChild(script);
    } else if (window.google) {
      console.log("Google Maps already loaded");
      setMapLoaded(true);
    }
    
    return () => {
      // Clean up the global callback when component unmounts
      if (window.initMap) {
        delete window.initMap;
      }
    };
  }, [authenticated, orderId]);
  
  // Initialize map when it's loaded
  useEffect(() => {
    if (mapLoaded && window.google && authenticated && orderId) {
      try {
        const mapElement = document.getElementById('driver-map');
        if (!mapElement) {
          console.error("Map element not found");
          setError("Map container not found. Please refresh the page.");
          return;
        }
        
        const order = getOrderById(orderId);
        if (!order) {
          setError("Order not found. Please check the order ID.");
          return;
        }
        
        // Default to business location if no locations available
        const defaultLocation = { lat: 9.751085, lng: 99.975936 }; // Koh Samui
        
        // Get customer location if available
        const customerLocation = order.gpsCoordinates 
          ? { lat: order.gpsCoordinates.latitude, lng: order.gpsCoordinates.longitude }
          : null;
        
        // Get driver location if available
        const driverLocation = order.driverLocation
          ? { lat: order.driverLocation.latitude, lng: order.driverLocation.longitude }
          : currentLocation || null;
        
        // Determine center point for map
        let center = defaultLocation;
        if (driverLocation) center = driverLocation;
        else if (customerLocation) center = customerLocation;
        
        // Create map
        const map = new window.google.maps.Map(mapElement, {
          zoom: 14,
          center,
          mapTypeControl: true,
          fullscreenControl: true,
          streetViewControl: true,
          zoomControl: true,
        });
        
        mapRef.current = map;
        
        // Add markers
        if (driverLocation) {
          const marker = new window.google.maps.Marker({
            position: driverLocation,
            map,
            title: 'Your Location',
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new window.google.maps.Size(40, 40),
            },
          });
          
          driverMarkerRef.current = marker;
        }
        
        if (customerLocation) {
          const marker = new window.google.maps.Marker({
            position: customerLocation,
            map,
            title: 'Delivery Location',
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new window.google.maps.Size(40, 40),
            },
          });
          
          customerMarkerRef.current = marker;
        }
        
        // If we have both locations, fit bounds to include both
        if (driverLocation && customerLocation) {
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend(driverLocation);
          bounds.extend(customerLocation);
          map.fitBounds(bounds);
        }
      } catch (error) {
        console.error("Error initializing Google Maps:", error);
        setError("Error initializing map. Please refresh the page.");
      }
    }
  }, [mapLoaded, authenticated, orderId, getOrderById, currentLocation]);
  
  // Update marker position when location changes
  useEffect(() => {
    if (mapRef.current && currentLocation) {
      if (driverMarkerRef.current) {
        // Update existing marker position
        driverMarkerRef.current.setPosition(currentLocation);
      } else if (currentLocation) {
        // Create new marker if it doesn't exist
        driverMarkerRef.current = new window.google.maps.Marker({
          position: currentLocation,
          map: mapRef.current,
          title: 'Your Location',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new window.google.maps.Size(40, 40),
          },
        });
      }
      
      // Center map on new location
      mapRef.current.panTo(currentLocation);
      
      // If we have both markers, fit bounds to include both
      if (driverMarkerRef.current && customerMarkerRef.current) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(driverMarkerRef.current.getPosition());
        bounds.extend(customerMarkerRef.current.getPosition());
        mapRef.current.fitBounds(bounds);
      }
    }
  }, [currentLocation]);
  
  // Start tracking function
  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    
    setIsTracking(true);
    updateCountRef.current = 0;
    
    // Get initial location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setCurrentLocation(newLocation);
        setLastUpdateTime(new Date().toLocaleTimeString());
        
        // Send location update to server
        if (orderId) {
          sendLocationUpdate(orderId, newLocation.lat, newLocation.lng);
        }
      },
      (error) => {
        handleLocationError(error);
      },
      { enableHighAccuracy: true }
    );
    
    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setCurrentLocation(newLocation);
        setLastUpdateTime(new Date().toLocaleTimeString());
        
        // Increment update count
        updateCountRef.current += 1;
        
        // Send location update to server
        // Only send every 5th update to reduce server load
        if (orderId && updateCountRef.current % 5 === 0) {
          sendLocationUpdate(orderId, newLocation.lat, newLocation.lng);
        }
      },
      (error) => {
        handleLocationError(error);
      },
      { 
        enableHighAccuracy: true,
        maximumAge: 10000,      // Accept positions that are up to 10 seconds old
        timeout: 10000          // Wait up to 10 seconds for a position
      }
    );
  };
  
  // Stop tracking function
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    setIsTracking(false);
  };
  
  // Handle location errors
  const handleLocationError = (error: GeolocationPositionError) => {
    let errorMessage;
    
    switch(error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "Location access was denied. Please enable location services for this website.";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Location information is unavailable. Please check your device's GPS.";
        break;
      case error.TIMEOUT:
        errorMessage = "Location request timed out. Please try again.";
        break;
      default:
        errorMessage = "An unknown error occurred while getting location.";
    }
    
    console.error("Geolocation error:", error);
    setError(errorMessage);
    setIsTracking(false);
  };
  
  // Send location update to server
  const sendLocationUpdate = async (orderId: string, latitude: number, longitude: number) => {
    try {
      console.log(`Sending location update for order ${orderId}: ${latitude}, ${longitude}`);
      
      // Update order with driver location
      await updateDriverLocation(orderId, latitude, longitude);
      
      console.log("Location update sent successfully");
    } catch (error) {
      console.error("Error sending location update:", error);
      // Don't stop tracking on error, just log it
    }
  };
  
  // Force a manual location update
  const forceLocationUpdate = () => {
    if (!isTracking || !navigator.geolocation || !orderId) return;
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setCurrentLocation(newLocation);
        setLastUpdateTime(new Date().toLocaleTimeString());
        
        // Always send on manual update
        sendLocationUpdate(orderId, newLocation.lat, newLocation.lng);
      },
      (error) => {
        handleLocationError(error);
      },
      { enableHighAccuracy: true }
    );
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);
  
  // If not authenticated or no order ID, show error
  if (!authenticated || !orderId) {
    return (
      <div className="pt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
            <div className="flex justify-center mb-6">
              <AlertTriangle className="w-16 h-16 text-red-500" />
            </div>
            <h2 className="text-2xl font-semibold mb-4 text-center">Access Error</h2>
            
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error || "Authentication required to access this page."}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Link
                to="/"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Get order details
  const order = getOrderById(orderId);
  
  return (
    <div className="pt-20">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <Link 
            to="/orders"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Orders
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b bg-blue-50">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold flex items-center">
                  <Truck className="w-5 h-5 mr-2 text-blue-600" />
                  Driver View - Order #{orderId}
                </h2>
                {order && (
                  <p className="text-gray-600 mt-1">
                    Delivering to: {order.customerInfo.name}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                {!isTracking ? (
                  <button
                    onClick={startTracking}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-1"
                  >
                    <Play className="w-4 h-4" />
                    Start Tracking
                  </button>
                ) : (
                  <>
                    <button
                      onClick={forceLocationUpdate}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Update Now
                    </button>
                    <button
                      onClick={stopTracking}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-1"
                    >
                      <Square className="w-4 h-4" />
                      Stop
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Tracking status */}
            {isTracking && lastUpdateTime && (
              <div className="mt-2 bg-blue-100 p-2 rounded-lg">
                <div className="flex items-center text-blue-700 text-sm">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span>Tracking active - Last update: {lastUpdateTime}</span>
                </div>
                {currentLocation && (
                  <p className="text-xs text-blue-600 mt-1">
                    Current coordinates: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                  </p>
                )}
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="mt-2 bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Map */}
          <div className="p-4">
            <div id="driver-map" className="w-full h-[400px] rounded-lg border border-gray-200"></div>
          </div>
          
          {/* Order details */}
          {order && (
            <div className="p-4 border-t">
              <h3 className="font-medium mb-2">Delivery Details</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-medium">{order.customerInfo.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{order.customerInfo.phone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Delivery Address</p>
                    <p className="font-medium">{order.deliveryAddress}</p>
                  </div>
                  {order.distance && (
                    <div>
                      <p className="text-sm text-gray-500">Distance</p>
                      <p className="font-medium">{order.distance.toFixed(1)} km</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Delivery Fee</p>
                    <p className="font-medium">{order.deliveryFee.toFixed(2)} THB</p>
                  </div>
                </div>
              </div>
              
              <h3 className="font-medium mt-4 mb-2">Order Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{item.name}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{item.quantity}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{item.days || 1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Actions */}
          {order && (
            <div className="p-4 border-t bg-gray-50">
              <div className="flex flex-wrap gap-2">
                {order.gpsCoordinates && (
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${order.gpsCoordinates.latitude},${order.gpsCoordinates.longitude}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-1"
                  >
                    <MapPin className="w-4 h-4" />
                    Navigate
                  </a>
                )}
                
                <a 
                  href={`tel:${order.customerInfo.phone}`}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-1"
                >
                  <Phone className="w-4 h-4 mr-1" />
                  Call Customer
                </a>
                
                <Link 
                  to={`/staff?order_id=${order.id}`}
                  className="bg-[#FFD700] text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#FFE44D] transition-colors flex items-center gap-1"
                >
                  <Package className="w-4 h-4 mr-1" />
                  Staff Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
