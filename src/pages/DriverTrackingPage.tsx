import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { 
  ArrowLeft, 
  MapPin, 
  Play, 
  Square, 
  AlertTriangle, 
  CheckCircle, 
  Navigation,
  Phone,
  MessageSquare,
  Package,
  Home,
  Clock,
  Tag,
  Truck,
  Check
} from 'lucide-react';

export default function DriverTrackingPage() {
  const { orders, getOrderById, updateOrderStatus, updateDriverLocation } = useOrders();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const orderId = queryParams.get('order_id');
  const driverCode = queryParams.get('code');
  
  // State for tracking
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number; lng: number} | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [orderAccepted, setOrderAccepted] = useState(false);
  
  // Refs for tracking and maps
  const watchIdRef = useRef<number | null>(null);
  const mapRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const updateCountRef = useRef<number>(0);
  
  // Load order data
  useEffect(() => {
    if (orderId) {
      const orderData = getOrderById(orderId);
      if (orderData) {
        setOrder(orderData);
        
        // Check if order is already accepted (status is "on our way")
        if (orderData.status === 'on our way') {
          setOrderAccepted(true);
        }
      }
    }
  }, [orderId, getOrderById, orders]);
  
  // Validate driver code
  useEffect(() => {
    if (!driverCode) {
      setMapError("Driver code is required for tracking");
    } else if (!['DRIVER123', 'DRIVER456', 'OWNER789', 'ADMIN123'].includes(driverCode)) {
      setMapError("Invalid driver code");
    }
  }, [driverCode]);
  
  // Load Google Maps API
  useEffect(() => {
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
  }, []);
  
  // Initialize map when it's loaded and order data is available
  useEffect(() => {
    if (mapLoaded && window.google && order) {
      try {
        const mapElement = document.getElementById('map');
        if (!mapElement) {
          console.error("Map element not found");
          setMapError("Map container not found. Please refresh the page.");
          return;
        }
        
        // Default to business location if no locations available
        const defaultLocation = { lat: 9.751085, lng: 99.975936 }; // Koh Samui
        
        // Get customer location if available
        const customerLocation = order.gpsCoordinates 
          ? { lat: order.gpsCoordinates.latitude, lng: order.gpsCoordinates.longitude }
          : null;
        
        // Determine center point for map
        let center = customerLocation || defaultLocation;
        
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
        
        // Add customer marker if location is available
        if (customerLocation) {
          customerMarkerRef.current = new window.google.maps.Marker({
            position: customerLocation,
            map,
            title: 'Delivery Location',
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new window.google.maps.Size(40, 40),
            },
          });
          
          // Add info window for customer
          const customerInfo = new window.google.maps.InfoWindow({
            content: `
              <div>
                <h3 style="font-weight: bold; margin-bottom: 5px;">${order.customerInfo.name}</h3>
                <p style="margin: 2px 0;">${order.deliveryAddress}</p>
                <p style="margin: 2px 0;">${order.customerInfo.phone}</p>
              </div>
            `
          });
          
          customerMarkerRef.current.addListener('click', () => {
            customerInfo.open(map, customerMarkerRef.current);
          });
        }
        
        // If we have current location, add driver marker
        if (currentLocation) {
          driverMarkerRef.current = new window.google.maps.Marker({
            position: currentLocation,
            map,
            title: 'Your Location',
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new window.google.maps.Size(40, 40),
            },
          });
          
          // If we have both locations, fit bounds to include both
          if (customerLocation) {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(currentLocation);
            bounds.extend(customerLocation);
            map.fitBounds(bounds);
          }
        }
      } catch (error) {
        console.error("Error initializing Google Maps:", error);
        setMapError("Error initializing map. Please refresh the page.");
      }
    }
  }, [mapLoaded, order, currentLocation]);
  
  // Update marker position when location changes
  useEffect(() => {
    if (mapRef.current && currentLocation) {
      if (driverMarkerRef.current) {
        // Update existing marker position
        driverMarkerRef.current.setPosition(currentLocation);
      } else {
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
      
      // If we have customer location, fit bounds to include both
      if (customerMarkerRef.current) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(currentLocation);
        bounds.extend(customerMarkerRef.current.getPosition());
        mapRef.current.fitBounds(bounds);
      } else {
        // Center map on driver location
        mapRef.current.panTo(currentLocation);
      }
    }
  }, [currentLocation]);
  
  // Start tracking function
  const startTracking = () => {
    if (!navigator.geolocation) {
      setMapError("Geolocation is not supported by this browser.");
      return;
    }
    
    setIsTracking(true);
    
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
          updateDriverLocation(orderId, newLocation.lat, newLocation.lng);
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
          updateDriverLocation(orderId, newLocation.lat, newLocation.lng);
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
    setMapError(errorMessage);
    setIsTracking(false);
  };
  
  // Force a manual location update
  const forceLocationUpdate = () => {
    if (!isTracking || !navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setCurrentLocation(newLocation);
        setLastUpdateTime(new Date().toLocaleTimeString());
        
        // Always send on manual update
        if (orderId) {
          updateDriverLocation(orderId, newLocation.lat, newLocation.lng);
        }
      },
      (error) => {
        handleLocationError(error);
      },
      { enableHighAccuracy: true }
    );
  };
  
  // Accept order function
  const acceptOrder = () => {
    if (orderId) {
      updateOrderStatus(orderId, 'on our way');
      setOrderAccepted(true);
      
      // Start tracking automatically when accepting order
      if (!isTracking) {
        startTracking();
      }
    }
  };
  
  // Mark as delivered function
  const markAsDelivered = () => {
    if (orderId) {
      updateOrderStatus(orderId, 'delivered');
      
      // Stop tracking when delivered
      if (isTracking) {
        stopTracking();
      }
      
      // Navigate back to dashboard
      navigate('/staff-dashboard');
    }
  };
  
  // Generate Google Maps navigation URL
  const getNavigationUrl = () => {
    if (!order || !order.gpsCoordinates) {
      // If no GPS coordinates, try to use the address
      if (order && order.deliveryAddress) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`;
      }
      return '#';
    }
    
    // If we have current location, use directions mode
    if (currentLocation) {
      return `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${order.gpsCoordinates.latitude},${order.gpsCoordinates.longitude}&travelmode=driving`;
    }
    
    // Otherwise just navigate to the destination
    return `https://www.google.com/maps/dir/?api=1&destination=${order.gpsCoordinates.latitude},${order.gpsCoordinates.longitude}&travelmode=driving`;
  };
  
  // Generate WhatsApp link
  const getWhatsAppLink = () => {
    if (!order || !order.customerInfo || !order.customerInfo.phone) {
      return '#';
    }
    
    // Format phone number (remove spaces, dashes, etc.)
    const phone = order.customerInfo.phone.replace(/\s+|-|\(|\)/g, '');
    
    // Create message with order details
    const message = `Hello! I'm on my way with your order #${order.id}. I'll be delivering your items soon.`;
    
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };
  
  // If no order found, show error
  if (!order) {
    return (
      <div className="pt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="flex justify-center mb-6">
              <AlertTriangle className="w-16 h-16 text-red-500" />
            </div>
            <h2 className="text-2xl font-semibold mb-4 text-center">Order Not Found</h2>
            <p className="text-gray-600 mb-6 text-center">
              The order you're looking for could not be found. Please check the order ID and try again.
            </p>
            <div className="flex justify-center">
              <Link
                to="/staff-dashboard"
                className="bg-[#FFD700] text-gray-900 px-6 py-2 rounded-lg font-bold hover:bg-[#FFE44D] transition-colors"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Check if order is in payment verification status - don't allow driver to accept
  const isPaymentVerificationPending = order.status === 'payment_verification';
  
  return (
    <div className="pt-20">
      <div className="container mx-auto px-6 py-8">
        {/* Header with back button and order status */}
        <div className="flex justify-between items-center mb-4">
          <Link 
            to="/staff-dashboard"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-500" />
              <span className="text-sm text-gray-600">
                Order Date: {new Date(order.orderDate).toLocaleDateString()}
              </span>
            </div>
            
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
              order.status === 'on our way' ? 'bg-blue-100 text-blue-800' :
              order.status === 'payment_verification' ? 'bg-orange-100 text-orange-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {order.status === 'payment_verification' ? 'Payment Verification' : order.status}
            </div>
          </div>
        </div>
        
        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Order details and items */}
          <div className="lg:col-span-1">
            {/* Order ID and Status Card */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="text-xl font-bold">Order Information</h2>
              </div>
              
              <div className="p-4">
                {/* Order ID Display */}
                <div className="bg-blue-50 p-4 rounded-lg mb-4 text-center border-2 border-blue-200">
                  <h3 className="text-sm text-blue-700 mb-1">Order ID</h3>
                  <div className="text-2xl font-bold text-blue-900">{order.id}</div>
                </div>
                
                {/* Customer Info */}
                <div className="mb-4">
                  <h3 className="font-bold text-lg mb-2">Customer</h3>
                  <p className="text-gray-700 mb-1"><strong>Name:</strong> {order.customerInfo.name}</p>
                  <p className="text-gray-700 mb-1"><strong>Phone:</strong> {order.customerInfo.phone}</p>
                  <p className="text-gray-700 mb-3"><strong>Address:</strong> {order.deliveryAddress}</p>
                </div>
                
                {/* Payment Verification Warning */}
                {isPaymentVerificationPending && (
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-4">
                    <div className="flex items-center mb-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
                      <h3 className="font-bold text-orange-800">Payment Verification Required</h3>
                    </div>
                    <p className="text-orange-700">
                      This order is awaiting payment verification by an administrator. You cannot accept this order until payment has been verified.
                    </p>
                  </div>
                )}
                
                {/* Order Status Actions */}
                <div className="flex flex-col gap-2">
                  {!orderAccepted && !isPaymentVerificationPending ? (
                    <button
                      onClick={acceptOrder}
                      className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Truck className="w-5 h-5" />
                      Accept Order & Start Delivery
                    </button>
                  ) : order.status !== 'delivered' && !isPaymentVerificationPending && (
                    <button
                      onClick={markAsDelivered}
                      className="w-full bg-green-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      Mark as Delivered
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Quick Actions Card */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="text-xl font-bold">Quick Actions</h2>
              </div>
              
              <div className="p-4">
                <div className="space-y-3">
                  <a
                    href={getNavigationUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Navigation className="w-5 h-5 mr-3 text-blue-600" />
                    <span className="font-medium">Navigate to Customer</span>
                  </a>
                  
                  <a
                    href={getWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <MessageSquare className="w-5 h-5 mr-3 text-green-600" />
                    <span className="font-medium">WhatsApp Customer</span>
                  </a>
                  
                  <a
                    href={`tel:${order.customerInfo.phone}`}
                    className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <Phone className="w-5 h-5 mr-3 text-purple-600" />
                    <span className="font-medium">Call Customer</span>
                  </a>
                  
                  <Link
                    to="/staff-dashboard"
                    className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Home className="w-5 h-5 mr-3 text-gray-600" />
                    <span className="font-medium">Return to Dashboard</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Middle column: Order Items */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="text-xl font-bold">Order Items</h2>
              </div>
              
              <div className="p-4">
                <div className="space-y-4">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                      {/* Product ID Badge */}
                      <div className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-md flex items-center mb-2 w-fit">
                        <Tag className="w-4 h-4 mr-1" />
                        {item.id || `PROD-${index + 1}`}
                      </div>
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">{item.name}</h3>
                          <p className="text-gray-600 text-sm">{item.brand}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{item.price} THB</div>
                          <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                          {item.days && <div className="text-sm text-gray-600">Days: {item.days}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Order Summary */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{order.totalAmount} THB</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Delivery Fee:</span>
                    <span className="font-medium">{order.deliveryFee} THB</span>
                  </div>
                  <div className="flex justify-between text-lg mt-2 pt-2 border-t border-gray-200">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold">{order.totalAmount + order.deliveryFee} THB</span>
                  </div>
                  
                  <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium">{order.paymentMethod}</span>
                    </div>
                    {order.distance && (
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-600">Distance:</span>
                        <span className="font-medium">{order.distance.toFixed(1)} km</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column: Map */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="text-xl font-bold">Delivery Map</h2>
                
                {/* Tracking status */}
                {isTracking && lastUpdateTime && (
                  <div className="mt-2 bg-blue-50 p-2 rounded-lg">
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
              </div>
              
              <div className="p-4">
                {mapError ? (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{mapError}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div id="map" className="w-full h-[400px] rounded-lg border border-gray-200"></div>
                )}
              </div>
              
              {/* Tracking controls - disabled if payment verification is pending */}
              <div className="p-4 border-t bg-gray-50">
                <div className="flex flex-wrap gap-2">
                  {!isTracking ? (
                    <button
                      onClick={startTracking}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-1"
                      disabled={!orderAccepted || isPaymentVerificationPending}
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
                        <MapPin className="w-4 h-4" />
                        Update Location
                      </button>
                      <button
                        onClick={stopTracking}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-1"
                      >
                        <Square className="w-4 h-4" />
                        Stop Tracking
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
