import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { webhookService } from '../utils/webhookService';
import { 
  ArrowLeft, 
  MapPin, 
  Play, 
  Square, 
  AlertTriangle, 
  CheckCircle, 
  Truck,
  RefreshCw,
  List,
  Search,
  User,
  LogOut,
  Package,
  Clock,
  Calendar,
  Phone,
  Mail,
  Home,
  Filter,
  ChevronDown,
  Settings,
  Shield
} from 'lucide-react';

// Define the tracking session
interface TrackingSession {
  orderId: string;
  isTracking: boolean;
  lastUpdateTime: string | null;
  currentLocation: {lat: number; lng: number} | null;
}

const StaffDashboardPage: React.FC = () => {
  const { orders, getOrderById, updateDriverLocation, updateOrderStatus, verifyPayment } = useOrders();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State for order selection and tracking
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [trackingSessions, setTrackingSessions] = useState<Record<string, TrackingSession>>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState<string | null>(null);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
  const [showAdminControls, setShowAdminControls] = useState(false);
  
  // Refs for tracking and maps
  const watchIdRef = useRef<Record<string, number>>({});
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const updateCountRef = useRef<Record<string, number>>({});
  
  // Check if user is authenticated and has staff role
  useEffect(() => {
    if (!user) {
      navigate('/staff-login');
      return;
    }
    
    // Check if user has staff role
    const staffRoles = ['staff', 'admin', 'driver', 'owner'];
    const isStaff = user.role && staffRoles.includes(user.role);
    
    if (!isStaff) {
      navigate('/staff-login');
    }
  }, [user, navigate]);
  
  // Filter orders based on search term, status filter, and staff role
  const filteredOrders = orders.filter(order => {
    // Apply status filter only if it's not set to 'all'
    if (statusFilter !== 'all' && order.status !== statusFilter) {
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

    return true; // Include all orders if no filters are applied
  });
  
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
    setSelectedOrderId(null);
    setTrackingSessions({});
    
    // Logout user
    logout();
    navigate('/staff-login');
  };
  
  // Load Google Maps API
  useEffect(() => {
    if (!user) return;
    
    if (!window.google && !document.getElementById('google-maps-script')) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDRDTFpVwaAjihQ1SLUuCeZLuIRhBj4seY&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      // Define the callback function globally
      window.initMap = () => {
        console.log("Google Maps API loaded for staff dashboard");
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
  }, [user]);
  
  // Initialize map when it's loaded and an order is selected
  useEffect(() => {
    if (mapLoaded && window.google && user && selectedOrderId) {
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
  }, [mapLoaded, selectedOrderId, user, getOrderById, trackingSessions]);
  
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
  
  // Handle order status update
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    if (!orderId || !newStatus) return;
    
    setIsUpdatingStatus(true);
    setStatusUpdateSuccess(null);
    setStatusUpdateError(null);
    
    try {
      // Update order status
      await updateOrderStatus(orderId, newStatus);
      
      // Get updated order
      const updatedOrder = getOrderById(orderId);
      
      if (updatedOrder) {
        // Send webhook notification
        try {
          await webhookService.sendOrderWebhook(updatedOrder);
          console.log(`Webhook sent for order ${orderId} status update to ${newStatus}`);
        } catch (webhookError) {
          console.error("Failed to send webhook for status update:", webhookError);
          // Continue with status update even if webhook fails
        }
      }
      
      setStatusUpdateSuccess(`Order status updated to ${formatStatus(newStatus)}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setStatusUpdateSuccess(null);
      }, 3000);
    } catch (error) {
      console.error("Error updating order status:", error);
      setStatusUpdateError("Failed to update order status. Please try again.");
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setStatusUpdateError(null);
      }, 5000);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle payment verification
  const handleVerifyPayment = async (orderId: string) => {
    try {
      await verifyPayment(orderId);
      setStatusUpdateSuccess("Payment verified successfully");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setStatusUpdateSuccess(null);
      }, 3000);
    } catch (error) {
      console.error("Error verifying payment:", error);
      setStatusUpdateError("Failed to verify payment. Please try again.");
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setStatusUpdateError(null);
      }, 5000);
    }
  };
  
  // Format status for display
  const formatStatus = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'on-the-way':
        return 'On the Way';
      case 'delivered':
        return 'Delivered';
      case 'completed':
        return 'Completed';
      case 'payment_verification':
        return 'Payment Verification';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  // Get next status options based on current status
  const getNextStatusOptions = (currentStatus: string): string[] => {
    const statusFlow = {
      'pending': ['processing'],
      'payment_verification': ['processing'],
      'processing': ['on-the-way'],
      'on-the-way': ['delivered'],
      'delivered': ['completed'],
      'completed': []
    };
    
    return statusFlow[currentStatus as keyof typeof statusFlow] || [];
  };
  
  // Get status badge color
  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'payment_verification':
        return 'bg-orange-100 text-orange-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'on-the-way':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Toggle admin controls visibility
  const toggleAdminControls = () => {
    setShowAdminControls(!showAdminControls);
  };
  
  // Refresh orders when the component mounts or updates
  useEffect(() => {
    const refreshOrders = async () => {
      try {
        // Simulate fetching updated orders from the server or context
        console.log("Refreshing orders for staff dashboard");
      } catch (error) {
        console.error("Failed to refresh orders:", error);
      }
    };

    refreshOrders();
  }, [orders]);

  // If not authenticated, the useEffect will redirect to login page
  if (!user) {
    return null;
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
              <span className="font-medium text-blue-600">{user.name || user.username} ({user.role})</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center text-gray-600 hover:text-gray-900 text-sm"
            >
              <LogOut className="w-4 h-4 mr-1" />
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
              
              <div className="mt-2">
                <div className="flex items-center">
                  <Filter className="w-4 h-4 mr-1 text-gray-500" />
                  <span className="text-sm text-gray-500 mr-2">Filter:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="all">All Orders</option>
                    <option value="pending">Pending</option>
                    <option value="payment_verification">Payment Verification</option>
                    <option value="processing">Processing</option>
                    <option value="on-the-way">On the Way</option>
                    <option value="delivered">Delivered</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                {filteredOrders.map(order => (
                  <div key={order.id} className="p-4 border rounded-lg mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Order #{order.id}</h3>
                        <p className="text-sm text-gray-600">{order.customerInfo.name}</p>
                        <p className="text-sm text-gray-500">{order.deliveryAddress}</p>
                      </div>
                      <div>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                          className="text-sm border rounded px-2 py-1"
                        >
                          <option value="pending">Pending</option>
                          <option value="payment_verification">Payment Verification</option>
                          <option value="processing">Processing</option>
                          <option value="on-the-way">On the Way</option>
                          <option value="delivered">Delivered</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
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
                          <p className="text-xs text-gray-400 mt-1">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(order.orderDate || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(order.status)}`}>
                            {formatStatus(order.status)}
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
                    
                    {/* Tracking controls - only show for drivers or if order is in processing/on-the-way status */}
                    {(() => {
                      const order = getOrderById(selectedOrderId);
                      if (!order) return null;
                      
                      const canTrack = user.role === 'driver' || user.role === 'admin' || user.role === 'owner';
                      const isTrackableStatus = order.status === 'processing' || order.status === 'on-the-way';
                      
                      if (canTrack && isTrackableStatus) {
                        return (
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
                        );
                      }
                      
                      return null;
                    })()}
                  </div>
                  
                  {/* Order details */}
                  {(() => {
                    const order = getOrderById(selectedOrderId);
                    if (!order) return null;
                    
                    return (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="flex items-center">
                            <User className="w-4 h-4 mr-1 text-gray-500" />
                            <span className="text-gray-600 mr-1">Customer:</span>
                            <span className="font-medium">{order.customerInfo.name}</span>
                          </p>
                          <p className="flex items-center">
                            <Phone className="w-4 h-4 mr-1 text-gray-500" />
                            <span className="text-gray-600 mr-1">Phone:</span>
                            <span className="font-medium">{order.customerInfo.phone}</span>
                          </p>
                          {order.customerInfo.email && (
                            <p className="flex items-center">
                              <Mail className="w-4 h-4 mr-1 text-gray-500" />
                              <span className="text-gray-600 mr-1">Email:</span>
                              <span className="font-medium">{order.customerInfo.email}</span>
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="flex items-center">
                            <Home className="w-4 h-4 mr-1 text-gray-500" />
                            <span className="text-gray-600 mr-1">Address:</span>
                            <span className="font-medium">{order.deliveryAddress}</span>
                          </p>
                          {order.distance && (
                            <p className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                              <span className="text-gray-600 mr-1">Distance:</span>
                              <span className="font-medium">{order.distance.toFixed(1)} km</span>
                            </p>
                          )}
                          <p className="flex items-center">
                            <Clock className="w-4 h-4 mr-1 text-gray-500" />
                            <span className="text-gray-600 mr-1">Order Date:</span>
                            <span className="font-medium">{new Date(order.orderDate || Date.now()).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Status update section */}
                  {(() => {
                    const order = getOrderById(selectedOrderId);
                    if (!order) return null;
                    
                    const nextStatusOptions = getNextStatusOptions(order.status);
                    const canUpdateStatus = user.role === 'admin' || user.role === 'owner' || 
                      (user.role === 'driver' && ['processing', 'on-the-way'].includes(order.status));
                    
                    if (canUpdateStatus && nextStatusOptions.length > 0) {
                      return (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">Current Status:</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(order.status)}`}>
                              {formatStatus(order.status)}
                            </span>
                            
                            <span className="mx-2 text-gray-400">→</span>
                            
                            <span className="text-sm font-medium">Update to:</span>
                            
                            {nextStatusOptions.map(status => (
                              <button
                                key={status}
                                onClick={() => handleStatusUpdate(order.id, status)}
                                disabled={isUpdatingStatus}
                                className={`px-3 py-1 text-xs rounded-full border transition-colors ${getStatusBadgeColor(status)} hover:opacity-80`}
                              >
                                {formatStatus(status)}
                              </button>
                            ))}
                            
                            {isUpdatingStatus && (
                              <span className="text-xs text-blue-600 flex items-center">
                                <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Updating...
                              </span>
                            )}
                          </div>
                          
                          {statusUpdateSuccess && (
                            <div className="mt-2 text-xs text-green-600">
                              <CheckCircle className="w-3 h-3 inline mr-1" />
                              {statusUpdateSuccess}
                            </div>
                          )}
                          
                          {statusUpdateError && (
                            <div className="mt-2 text-xs text-red-600">
                              <AlertTriangle className="w-3 h-3 inline mr-1" />
                              {statusUpdateError}
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    return null;
                  })()}

                  {/* Payment verification section */}
                  {(() => {
                    const order = getOrderById(selectedOrderId);
                    if (!order || order.status !== 'payment_verification') return null;
                    
                    const canVerifyPayment = user.role === 'admin' || user.role === 'owner';
                    
                    if (canVerifyPayment) {
                      return (
                        <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                          <h4 className="font-medium text-yellow-800 mb-2">Payment Verification Required</h4>
                          <p className="text-yellow-700 mb-3 text-sm">
                            This order is awaiting payment verification. Once payment is confirmed, you can update the status.
                          </p>
                          <button
                            onClick={() => handleVerifyPayment(order.id)}
                            className="bg-[#FFD700] text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#FFE44D] transition-colors"
                          >
                            Verify Payment
                          </button>
                        </div>
                      );
                    }
                    
                    return null;
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

                  {/* Admin Controls Section */}
                  {(user.role === 'admin' || user.role === 'owner') && (
                    <div className="mt-4">
                      <button
                        onClick={toggleAdminControls}
                        className="flex items-center text-gray-700 bg-gray-100 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        {showAdminControls ? 'Hide Admin Controls' : 'Show Admin Controls'}
                        <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showAdminControls ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showAdminControls && (
                        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center mb-2">
                            <Shield className="w-4 h-4 text-purple-600 mr-1" />
                            <h3 className="text-sm font-medium text-purple-600">Admin Controls</h3>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleStatusUpdate(selectedOrderId, 'pending')}
                              className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-300"
                            >
                              Set Pending
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(selectedOrderId, 'payment_verification')}
                              className="bg-orange-100 text-orange-700 px-3 py-1 rounded text-xs hover:bg-orange-200"
                            >
                              Set Payment Verification
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(selectedOrderId, 'processing')}
                              className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded text-xs hover:bg-yellow-200"
                            >
                              Set Processing
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(selectedOrderId, 'on-the-way')}
                              className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs hover:bg-blue-200"
                            >
                              Set On The Way
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(selectedOrderId, 'delivered')}
                              className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs hover:bg-green-200"
                            >
                              Set Delivered
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(selectedOrderId, 'completed')}
                              className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-xs hover:bg-purple-200"
                            >
                              Set Completed
                            </button>
                          </div>
                        </div>
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
                    <div id="staff-map" className="w-full h-[400px] rounded-lg border border-gray-200"></div>
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
                            to={`/driver-tracking?order_id=${order.id}&code=${user.role === 'driver' ? 'DRIVER123' : 'OWNER789'}`}
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
                  Please select an order from the list to view details and manage delivery.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboardPage;
