import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { 
  ArrowLeft, 
  MapPin, 
  Play, 
  Square, 
  AlertTriangle, 
  CheckCircle, 
  Lock, 
  Truck,
  RefreshCw,
  List,
  Search,
  User
} from 'lucide-react';

// Define the staff authentication state
interface StaffAuth {
  isAuthenticated: boolean;
  staffId: string;
  staffName: string;
  role: 'driver' | 'owner' | 'admin';
}

// Define the tracking session
interface TrackingSession {
  orderId: string;
  isTracking: boolean;
  lastUpdateTime: string | null;
  currentLocation: {lat: number; lng: number} | null;
}

export default function StaffTrackingPage() {
  const { orders, getOrderById, updateDriverLocation } = useOrders();
  const navigate = useNavigate();
  
  // State for authentication and tracking
  const [staffAuth, setStaffAuth] = useState<StaffAuth>({
    isAuthenticated: false,
    staffId: '',
    staffName: '',
    role: 'driver'
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [staffCode, setStaffCode] = useState('');
  
  // State for order selection and tracking
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [trackingSessions, setTrackingSessions] = useState<Record<string, TrackingSession>>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Refs for tracking and maps
  const watchIdRef = useRef<Record<string, number>>({});
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const updateCountRef = useRef<Record<string, number>>({});
  
  // Filter orders based on search term and staff role
  const filteredOrders = orders.filter(order => {
    // For drivers, only show processing orders
    if (staffAuth.role === 'driver' && order.status !== 'processing') {
      return false;
    }
    
    // Filter by search term (order ID, customer name, or address)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        order.id.toLowerCase().includes(searchLower) ||
        order.customerInfo.name.toLowerCase().includes(searchLower) ||
        order.deliveryAddress.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Handle staff login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation - in production this would be more secure
    const validCodes: Record<string, {staffId: string, staffName: string, role: StaffAuth['role']}> = {
      'DRIVER123': { staffId: 'D001', staffName: 'John Driver', role: 'driver' },
      'DRIVER456': { staffId: 'D002', staffName: 'Sarah Driver', role: 'driver' },
      'OWNER789': { staffId: 'O001', staffName: 'Owner Admin', role: 'owner' },
      'ADMIN123': { staffId: 'A001', staffName: 'System Admin', role: 'admin' }
    };
    
    if (validCodes[staffCode]) {
      setStaffAuth({
        isAuthenticated: true,
        staffId: validCodes[staffCode].staffId,
        staffName: validCodes[staffCode].staffName,
        role: validCodes[staffCode].role
      });
      setAuthError(null);
      console.log(`Staff authenticated: ${validCodes[staffCode].staffName} (${validCodes[staffCode].role})`);
    } else {
      setAuthError('Invalid staff code. Please use a valid code to access this system.');
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    // Stop all tracking sessions
    Object.keys(watchIdRef.current).forEach(orderId => {
      if (watchIdRef.current[orderId]) {
        navigator.geolocation.clearWatch(watchIdRef.current[orderId]);
        delete watchIdRef.current[orderId];
      }
    });
    
    // Reset state
    setStaffAuth({
      isAuthenticated: false,
      staffId: '',
      staffName: '',
      role: 'driver'
    });
    setSelectedOrderId(null);
    setTrackingSessions({});
  };
  
  // Load Google Maps API
  useEffect(() => {
    if (!staffAuth.isAuthenticated) return;
    
    if (!window.google && !document.getElementById('google-maps-script')) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDRDTFpVwaAjihQ1SLUuCeZLuIRhBj4seY&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      // Define the callback function globally
      window.initMap = () => {
        console.log("Google Maps API loaded for staff tracking");
        setMapLoaded(true);
      };
      
      // Add error handling for the script
      script.onerror = () => {
        console.error("Failed to load Google Maps API");
        setMapError("Failed to load Google Maps. Please try again later.");
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
  }, [staffAuth.isAuthenticated]);
  
  // Initialize map when it's loaded and an order is selected
  useEffect(() => {
    if (mapLoaded && window.google && staffAuth.isAuthenticated && selectedOrderId) {
      try {
        const mapElement = document.getElementById('staff-map');
        if (!mapElement) {
          console.error("Map element not found");
          setMapError("Map container not found. Please refresh the page.");
          return;
        }
        
        const selectedOrder = getOrderById(selectedOrderId);
        if (!selectedOrder) {
          console.error("Selected order not found");
          return;
        }
        
        // Default to business location if no locations available
        const defaultLocation = { lat: 9.751085, lng: 99.975936 }; // Koh Samui
        
        // Get customer location if available
        const customerLocation = selectedOrder.gpsCoordinates 
          ? { lat: selectedOrder.gpsCoordinates.latitude, lng: selectedOrder.gpsCoordinates.longitude }
          : null;
        
        // Get driver location if available
        const driverLocation = selectedOrder.driverLocation
          ? { lat: selectedOrder.driverLocation.latitude, lng: selectedOrder.driverLocation.longitude }
          : trackingSessions[selectedOrderId]?.currentLocation || null;
        
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
            title: 'Driver Location',
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new window.google.maps.Size(40, 40),
            },
          });
          
          markersRef.current[selectedOrderId] = marker;
        }
        
        if (customerLocation) {
          new window.google.maps.Marker({
            position: customerLocation,
            map,
            title: 'Delivery Location',
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new window.google.maps.Size(40, 40),
            },
          });
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
        setMapError("Error initializing map. Please refresh the page.");
      }
    }
  }, [mapLoaded, selectedOrderId, staffAuth.isAuthenticated, getOrderById, trackingSessions]);
  
  // Update marker position when location changes
  useEffect(() => {
    if (mapRef.current && selectedOrderId && trackingSessions[selectedOrderId]?.currentLocation) {
      const currentLocation = trackingSessions[selectedOrderId].currentLocation;
      
      if (markersRef.current[selectedOrderId]) {
        // Update existing marker position
        markersRef.current[selectedOrderId].setPosition(currentLocation);
      } else if (currentLocation) {
        // Create new marker if it doesn't exist
        markersRef.current[selectedOrderId] = new window.google.maps.Marker({
          position: currentLocation,
          map: mapRef.current,
          title: 'Driver Location',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new window.google.maps.Size(40, 40),
          },
        });
      }
      
      // Center map on new location
      mapRef.current.panTo(currentLocation);
    }
  }, [selectedOrderId, trackingSessions]);
  
  // Start tracking function
  const startTracking = (orderId: string) => {
    if (!navigator.geolocation) {
      setMapError("Geolocation is not supported by this browser.");
      return;
    }
    
    // Initialize tracking session
    setTrackingSessions(prev => ({
      ...prev,
      [orderId]: {
        orderId,
        isTracking: true,
        lastUpdateTime: null,
        currentLocation: null
      }
    }));
    
    // Initialize update count
    updateCountRef.current[orderId] = 0;
    
    // Get initial location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setTrackingSessions(prev => ({
          ...prev,
          [orderId]: {
            ...prev[orderId],
            currentLocation: newLocation,
            lastUpdateTime: new Date().toLocaleTimeString()
          }
        }));
        
        // Send location update to server
        sendLocationUpdate(orderId, newLocation.lat, newLocation.lng);
      },
      (error) => {
        handleLocationError(error, orderId);
      },
      { enableHighAccuracy: true }
    );
    
    // Start watching position
    watchIdRef.current[orderId] = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setTrackingSessions(prev => ({
          ...prev,
          [orderId]: {
            ...prev[orderId],
            currentLocation: newLocation,
            lastUpdateTime: new Date().toLocaleTimeString()
          }
        }));
        
        // Increment update count
        updateCountRef.current[orderId] = (updateCountRef.current[orderId] || 0) + 1;
        
        // Send location update to server
        // Only send every 5th update to reduce server load
        if (updateCountRef.current[orderId] % 5 === 0) {
          sendLocationUpdate(orderId, newLocation.lat, newLocation.lng);
        }
      },
      (error) => {
        handleLocationError(error, orderId);
      },
      { 
        enableHighAccuracy: true,
        maximumAge: 10000,      // Accept positions that are up to 10 seconds old
        timeout: 10000          // Wait up to 10 seconds for a position
      }
    );
  };
  
  // Stop tracking function
  const stopTracking = (orderId: string) => {
    if (watchIdRef.current[orderId]) {
      navigator.geolocation.clearWatch(watchIdRef.current[orderId]);
      delete watchIdRef.current[orderId];
    }
    
    setTrackingSessions(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        isTracking: false
      }
    }));
  };
  
  // Handle location errors
  const handleLocationError = (error: GeolocationPositionError, orderId: string) => {
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
    setMapError(errorMessage);
    
    // Stop tracking for this order
    setTrackingSessions(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        isTracking: false
      }
    }));
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
  const forceLocationUpdate = (orderId: string) => {
    if (!trackingSessions[orderId]?.isTracking || !navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setTrackingSessions(prev => ({
          ...prev,
          [orderId]: {
            ...prev[orderId],
            currentLocation: newLocation,
            lastUpdateTime: new Date().toLocaleTimeString()
          }
        }));
        
        // Always send on manual update
        sendLocationUpdate(orderId, newLocation.lat, newLocation.lng);
      },
      (error) => {
        handleLocationError(error, orderId);
      },
      { enableHighAccuracy: true }
    );
  };
  
  // If not authenticated, show login screen
  if (!staffAuth.isAuthenticated) {
    return (
      <div className="pt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
            <div className="flex justify-center mb-6">
              <Lock className="w-16 h-16 text-gray-700" />
            </div>
            <h2 className="text-2xl font-semibold mb-4 text-center">Staff Access Only</h2>
            
            {authError && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{authError}</p>
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-gray-600 mb-6 text-center">
              This page is restricted to authorized staff members only. Please use your staff code to access the tracking system.
            </p>
            
            <form 
              className="space-y-4"
              onSubmit={handleLogin}
            >
              <div>
                <label htmlFor="staffCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Staff Code
                </label>
                <input
                  type="text"
                  id="staffCode"
                  name="staffCode"
                  placeholder="Enter your staff code"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                  value={staffCode}
                  onChange={(e) => setStaffCode(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  For demo: Use DRIVER123, DRIVER456, OWNER789, or ADMIN123
                </p>
              </div>
              
              <button
                type="submit"
                className="w-full bg-[#FFD700] text-gray-900 py-2 rounded-lg font-bold hover:bg-[#FFE44D] transition-colors"
              >
                Access Tracking System
              </button>
            </form>
            
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
  
  return (
    <div className="pt-20">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <Link 
            to="/"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              <span className="font-medium text-blue-600">{staffAuth.staffName} ({staffAuth.role})</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">Orders</h2>
              <div className="mt-2 relative">
                <input
                  type="text"
                  placeholder="Search orders..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[600px]">
              {filteredOrders.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No orders found
                </div>
              ) : (
                <ul className="divide-y">
                  {filteredOrders.map(order => (
                    <li 
                      key={order.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedOrderId === order.id ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{order.id}</h3>
                          <p className="text-sm text-gray-600">{order.customerInfo.name}</p>
                          <p className="text-sm text-gray-500 truncate max-w-[200px]">{order.deliveryAddress}</p>
                        </div>
                        <div>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                          
                          {/* Tracking status indicator */}
                          {trackingSessions[order.id]?.isTracking && (
                            <div className="mt-1 flex items-center text-xs text-green-600">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                              Tracking
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          {/* Map and Controls */}
          <div className="lg:col-span-2">
            {selectedOrderId ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">
                      Order {selectedOrderId}
                    </h2>
                    
                    {/* Tracking controls */}
                    <div className="flex gap-2">
                      {!trackingSessions[selectedOrderId]?.isTracking ? (
                        <button
                          onClick={() => startTracking(selectedOrderId)}
                          className="bg-green-500 text-white px-4 py-1 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          Start Tracking
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => forceLocationUpdate(selectedOrderId)}
                            className="bg-blue-500 text-white px-4 py-1 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Update
                          </button>
                          <button
                            onClick={() => stopTracking(selectedOrderId)}
                            className="bg-red-500 text-white px-4 py-1 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-1"
                          >
                            <Square className="w-3 h-3" />
                            Stop
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Order details */}
                  {(() => {
                    const order = getOrderById(selectedOrderId);
                    if (!order) return null;
                    
                    return (
                      <div className="mt-2 text-sm text-gray-600">
                        <p><strong>Customer:</strong> {order.customerInfo.name} ({order.customerInfo.phone})</p>
                        <p><strong>Address:</strong> {order.deliveryAddress}</p>
                        {order.distance && (
                          <p><strong>Distance:</strong> {order.distance.toFixed(1)} km</p>
                        )}
                      </div>
                    );
                  })()}
                  
                  {/* Tracking status */}
                  {trackingSessions[selectedOrderId]?.isTracking && trackingSessions[selectedOrderId]?.lastUpdateTime && (
                    <div className="mt-2 bg-blue-50 p-2 rounded-lg">
                      <div className="flex items-center text-blue-700 text-sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        <span>Tracking active - Last update: {trackingSessions[selectedOrderId].lastUpdateTime}</span>
                      </div>
                      {trackingSessions[selectedOrderId]?.currentLocation && (
                        <p className="text-xs text-blue-600 mt-1">
                          Current coordinates: {trackingSessions[selectedOrderId].currentLocation.lat.toFixed(6)}, {trackingSessions[selectedOrderId].currentLocation.lng.toFixed(6)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Map */}
                <div className="p-4">
                  {mapError ? (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                      <div className="flex">
                        <div className="ml-3">
                          <p className="text-sm text-red-700">{mapError}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div id="staff-map" className="w-full h-[500px] rounded-lg border border-gray-200"></div>
                  )}
                </div>
                
                {/* Order items */}
                <div className="p-4 border-t">
                  <h3 className="font-medium mb-2">Order Items</h3>
                  {(() => {
                    const order = getOrderById(selectedOrderId);
                    if (!order) return null;
                    
                    return (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {order.items.map((item, index) => (
                              <tr key={index}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{item.name}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{item.quantity}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{item.days || 1}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{item.price} THB</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50">
                            <tr>
                              <td colSpan={3} className="px-4 py-2 text-sm text-right font-medium">Subtotal:</td>
                              <td className="px-4 py-2 text-sm">{order.totalAmount} THB</td>
                            </tr>
                            <tr>
                              <td colSpan={3} className="px-4 py-2 text-sm text-right font-medium">Delivery Fee:</td>
                              <td className="px-4 py-2 text-sm">{order.deliveryFee} THB</td>
                            </tr>
                            <tr>
                              <td colSpan={3} className="px-4 py-2 text-sm text-right font-medium">Total:</td>
                              <td className="px-4 py-2 text-sm font-bold">{order.totalAmount + order.deliveryFee} THB</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    );
                  })()}
                </div>
                
                {/* Actions */}
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const order = getOrderById(selectedOrderId);
                      if (!order) return null;
                      
                      return (
                        <>
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
                            className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                          >
                            Call Customer
                          </a>
                          
                          <Link 
                            to={`/driver-tracking?order_id=${order.id}&code=${staffAuth.role === 'driver' ? 'DRIVER123' : 'OWNER789'}`}
                            className="bg-[#FFD700] text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#FFE44D] transition-colors"
                          >
                            Open Driver View
                          </Link>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <List className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Order Selected</h2>
                <p className="text-gray-600">
                  Please select an order from the list to view details and start tracking.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
