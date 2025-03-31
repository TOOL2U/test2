import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { ArrowLeft, Package, Truck, CheckCircle, MapPin, Clock } from 'lucide-react';

// Add type definition for window to include google and initMap
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

// Mock driver location data (in a real app, this would come from an API)
const MOCK_DRIVER_LOCATIONS: Record<string, { lat: number; lng: number; status: string }> = {
  // Default location near Koh Samui
  default: { lat: 9.751085, lng: 99.975936, status: 'Preparing for delivery' },
};

export default function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const { getOrderById } = useOrders();
  const order = orderId ? getOrderById(orderId) : null;
  
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number; status: string } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState('');
  const [estimatedArrival, setEstimatedArrival] = useState('');
  const [mapError, setMapError] = useState<string | null>(null);

  // Load Google Maps API
  useEffect(() => {
    // For debugging
    console.log("TrackOrderPage mounted, orderId:", orderId);
    console.log("Order data:", order);
    
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
  }, [orderId, order]);

  // Fetch driver location (simulated)
  useEffect(() => {
    if (!orderId) return;
    
    console.log("Fetching driver location for order:", orderId);
    
    // In a real app, this would be an API call
    const fetchDriverLocation = () => {
      // Simulate API call delay
      setTimeout(() => {
        // Use mock data or generate random nearby location
        const mockLocation = MOCK_DRIVER_LOCATIONS[orderId] || MOCK_DRIVER_LOCATIONS.default;
        
        // Add some randomness to simulate movement (within 0.01 degrees ~ 1km)
        const jitter = 0.005;
        const location = {
          lat: mockLocation.lat + (Math.random() * jitter * 2 - jitter),
          lng: mockLocation.lng + (Math.random() * jitter * 2 - jitter),
          status: mockLocation.status
        };
        
        console.log("Driver location updated:", location);
        setDriverLocation(location);
        
        // Set delivery status based on order status
        if (order) {
          switch (order.status) {
            case 'processing':
              setDeliveryStatus('Driver is preparing for delivery');
              setEstimatedArrival('Estimated arrival: 45-60 minutes');
              break;
            case 'delivered':
              setDeliveryStatus('Driver is nearby');
              setEstimatedArrival('Estimated arrival: 5-10 minutes');
              break;
            default:
              setDeliveryStatus('Order is being processed');
              setEstimatedArrival('');
          }
        }
      }, 1000);
    };
    
    // Initial fetch
    fetchDriverLocation();
    
    // Set up polling for location updates
    const intervalId = setInterval(fetchDriverLocation, 10000); // Update every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [orderId, order]);

  // Initialize and update map when driver location or map loaded status changes
  useEffect(() => {
    console.log("Map update effect triggered:", { mapLoaded, driverLocation });
    
    if (mapLoaded && driverLocation && window.google) {
      console.log("Initializing map with driver location:", driverLocation);
      
      try {
        // Get map container element
        const mapElement = document.getElementById('map');
        if (!mapElement) {
          console.error("Map element not found");
          setMapError("Map container not found. Please refresh the page.");
          return;
        }
        
        // Get customer location from order if available
        const customerLocation = order?.gpsCoordinates 
          ? { lat: order.gpsCoordinates.latitude, lng: order.gpsCoordinates.longitude }
          : null;
        
        console.log("Customer location:", customerLocation);
        
        // Create map centered on driver
        const map = new window.google.maps.Map(mapElement, {
          zoom: 14,
          center: { lat: driverLocation.lat, lng: driverLocation.lng },
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        });
        
        // Add driver marker
        new window.google.maps.Marker({
          position: { lat: driverLocation.lat, lng: driverLocation.lng },
          map,
          title: 'Driver Location',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new window.google.maps.Size(40, 40),
          },
        });
        
        // Add customer marker if location is available
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
          
          // Fit bounds to include both markers
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend({ lat: driverLocation.lat, lng: driverLocation.lng });
          bounds.extend(customerLocation);
          map.fitBounds(bounds);
        }
      } catch (error) {
        console.error("Error initializing Google Maps:", error);
        setMapError("Error initializing map. Please refresh the page.");
      }
    }
  }, [mapLoaded, driverLocation, order]);

  if (!orderId || !order) {
    return (
      <div className="pt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-semibold mb-4">Order Not Found</h2>
            <p className="text-gray-600 mb-6">
              We couldn't find the order you're looking for. Please check the order ID and try again.
            </p>
            <Link
              to="/orders"
              className="bg-[#FFD700] text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-[#FFE44D] transition-colors inline-block"
            >
              Back to My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20">
      <div className="container mx-auto px-6 py-8">
        <Link 
          to="/orders"
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Orders
        </Link>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold mb-2">Track Order {order.id}</h1>
            <p className="text-gray-500">Delivery to: {order.deliveryAddress}</p>
          </div>
          
          {/* Order Status Timeline */}
          <div className="p-6 border-b">
            <h2 className="font-semibold mb-4">Order Status</h2>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              {/* Status steps */}
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${order.status !== 'payment_verification' ? 'bg-green-500' : 'bg-gray-300'} mr-4`}>
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">Order Confirmed</h3>
                    <p className="text-sm text-gray-500">Your order has been received and confirmed</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${order.status === 'processing' || order.status === 'delivered' || order.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'} mr-4`}>
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">Processing</h3>
                    <p className="text-sm text-gray-500">Your order is being prepared for delivery</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${order.status === 'delivered' || order.status === 'completed' ? 'bg-green-500' : order.status === 'processing' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'} mr-4`}>
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">Out for Delivery</h3>
                    <p className="text-sm text-gray-500">Your order is on its way to you</p>
                    {order.status === 'processing' && (
                      <p className="text-sm font-medium text-blue-500">{deliveryStatus}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${order.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'} mr-4`}>
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">Delivered</h3>
                    <p className="text-sm text-gray-500">Your order has been delivered</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Live Tracking Map */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Live Tracking</h2>
              {estimatedArrival && (
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-1" />
                  {estimatedArrival}
                </div>
              )}
            </div>
            
            {mapError ? (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{mapError}</p>
                  </div>
                </div>
              </div>
            ) : driverLocation ? (
              <>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <MapPin className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        {deliveryStatus}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div id="map" className="w-full h-[400px] rounded-lg border border-gray-200"></div>
                
                <p className="text-xs text-gray-500 mt-2">
                  * This is a simulated tracking demo. In a production environment, this would show real-time driver location.
                </p>
              </>
            ) : (
              <div className="flex justify-center items-center h-[400px] bg-gray-100 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading tracking information...</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Contact Support */}
          <div className="p-6 border-t bg-gray-50">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-gray-600 mb-4">
              If you have any questions about your delivery, please contact our customer support.
            </p>
            <a 
              href="https://wa.me/66933880630" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-[#FFD700] text-gray-900 px-6 py-2 rounded-lg font-bold hover:bg-[#FFE44D] transition-colors inline-block"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
