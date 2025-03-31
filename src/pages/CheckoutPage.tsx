import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Calendar, Lock, MapPin, Loader2, ArrowLeft, Wallet, Building2, QrCode, AlertCircle, Navigation, Map } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrderContext';
import { calculateDistance, calculateDeliveryFee } from '../utils/distanceCalculator';
import Button from '../components/Button';

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyDRDTFpVwaAjihQ1SLUuCeZLuIRhBj4seY';
// Business location (Koh Samui)
const BUSINESS_LOCATION = { lat: 9.751085, lng: 99.975936 };

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
}

// Define a type for the Google Maps script loading state
type MapLoadingState = 'idle' | 'loading' | 'loaded' | 'error';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clearCart, totalItems } = useCart();
  const { addOrder } = useOrders();
  
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedDeliveryTime, setSelectedDeliveryTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(500); // Default delivery fee
  const [mapLoadingState, setMapLoadingState] = useState<MapLoadingState>('idle');
  
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const scriptLoadedRef = useRef<boolean>(false);
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    latitude: null,
    longitude: null
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/basket');
    }
  }, [items, navigate]);

  // Load Google Maps API
  useEffect(() => {
    // Check if script is already loaded or loading
    const existingScript = document.getElementById('google-maps-script');
    
    if (existingScript) {
      if (scriptLoadedRef.current) {
        setMapLoadingState('loaded');
        return;
      }
      
      // If script exists but not marked as loaded, wait for it
      existingScript.addEventListener('load', () => {
        scriptLoadedRef.current = true;
        setMapLoadingState('loaded');
      });
      
      existingScript.addEventListener('error', () => {
        setMapLoadingState('error');
        setLocationError("Failed to load Google Maps. Please try again later.");
      });
      
      return;
    }
    
    // If window.google exists, the API is already loaded
    if (window.google && window.google.maps) {
      scriptLoadedRef.current = true;
      setMapLoadingState('loaded');
      return;
    }
    
    // Load the script if it doesn't exist
    setMapLoadingState('loading');
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('Google Maps script loaded successfully');
      scriptLoadedRef.current = true;
      setMapLoadingState('loaded');
    };
    
    script.onerror = (e) => {
      console.error('Error loading Google Maps script:', e);
      setMapLoadingState('error');
      setLocationError("Failed to load Google Maps. Please check your internet connection and try again.");
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Don't remove the script on unmount as it might be used by other components
    };
  }, []);

  // Initialize map when it's shown and API is loaded
  useEffect(() => {
    if (!showMap || mapLoadingState !== 'loaded' || !mapRef.current) {
      return;
    }
    
    console.log('Initializing map with state:', { 
      showMap, 
      mapLoadingState, 
      hasMapRef: !!mapRef.current,
      hasGoogleMaps: !!(window.google && window.google.maps)
    });
    
    // Safety check for Google Maps API
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not available despite loaded state');
      setMapLoadingState('error');
      setLocationError("Google Maps failed to initialize. Please refresh the page and try again.");
      return;
    }
    
    try {
      // Initialize the map
      const map = new window.google.maps.Map(mapRef.current, {
        center: BUSINESS_LOCATION,
        zoom: 12,
        mapTypeControl: false,
      });
      googleMapRef.current = map;
      
      console.log('Map initialized successfully');

      // Add a marker for the business location
      new window.google.maps.Marker({
        position: BUSINESS_LOCATION,
        map,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new window.google.maps.Size(40, 40),
        },
        title: 'Tool2U Location',
      });

      // Add a draggable marker for the customer location
      const marker = new window.google.maps.Marker({
        position: formData.latitude && formData.longitude 
          ? { lat: formData.latitude, lng: formData.longitude }
          : BUSINESS_LOCATION,
        map,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
        title: 'Your Delivery Location',
      });
      markerRef.current = marker;

      // Add Places Autocomplete
      const input = document.getElementById('address-input') as HTMLInputElement;
      if (input && window.google.maps.places) {
        const autocomplete = new window.google.maps.places.Autocomplete(input);
        autocompleteRef.current = autocomplete;
        autocomplete.bindTo('bounds', map);

        // Update marker and form when place is selected
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) return;

          // Update map and marker
          map.setCenter(place.geometry.location);
          marker.setPosition(place.geometry.location);

          // Update form data
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          updateLocationData(lat, lng, place.formatted_address || '');
        });
      }

      // Update form data when marker is dragged
      marker.addListener('dragend', () => {
        const position = marker.getPosition();
        if (position) {
          const lat = position.lat();
          const lng = position.lng();
          
          // Reverse geocode to get address
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              updateLocationData(lat, lng, results[0].formatted_address);
            } else {
              updateLocationData(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            }
          });
        }
      });

      // If we already have coordinates, center the map there
      if (formData.latitude && formData.longitude) {
        const position = { lat: formData.latitude, lng: formData.longitude };
        map.setCenter(position);
        marker.setPosition(position);
      }
      
      // Try to get user's location if we don't have coordinates yet
      if (!formData.latitude || !formData.longitude) {
        handleLocationFind();
      }
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      setMapLoadingState('error');
      setLocationError(`Failed to initialize map: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [showMap, mapLoadingState, formData.latitude, formData.longitude]);

  // Update location data and calculate delivery fee
  const updateLocationData = async (lat: number, lng: number, address: string) => {
    // Extract city and postal code from address components if possible
    let city = formData.city;
    let postalCode = formData.postalCode;
    
    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      try {
        const response = await geocoder.geocode({ location: { lat, lng } });
        if (response.results && response.results[0]) {
          const addressComponents = response.results[0].address_components;
          
          // Find city and postal code
          for (const component of addressComponents) {
            if (component.types.includes('locality')) {
              city = component.long_name;
            } else if (component.types.includes('postal_code')) {
              postalCode = component.long_name;
            }
          }
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }
    }
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      address,
      city: city || prev.city,
      postalCode: postalCode || prev.postalCode,
      latitude: lat,
      longitude: lng
    }));
    
    // Calculate distance and delivery fee
    const dist = calculateDistance(
      BUSINESS_LOCATION.lat, 
      BUSINESS_LOCATION.lng, 
      lat, 
      lng
    );
    setDistance(dist);
    
    const fee = calculateDeliveryFee(dist);
    setDeliveryFee(fee);
    
    // Clear any address error
    if (formErrors.address) {
      setFormErrors(prev => ({ ...prev, address: undefined }));
    }
  };

  const deliveryTimeSlots = [
    '09:00 - 11:00',
    '11:00 - 13:00',
    '13:00 - 15:00',
    '15:00 - 17:00',
    '17:00 - 19:00'
  ];

  // Calculate order totals
  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity * item.days), 0);
  const tax = subtotal * 0.07; // 7% tax
  const total = subtotal + deliveryFee + tax;

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.postalCode.trim()) errors.postalCode = 'Postal code is required';
    if (!formData.phone?.trim()) errors.phone = 'Phone number is required';
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!selectedDeliveryTime) {
      alert('Please select a delivery time slot');
      return false;
    }
    
    if (!paymentMethod) {
      alert('Please select a payment method');
      return false;
    }
    
    if (!formData.latitude || !formData.longitude) {
      errors.address = 'Please select a valid location on the map';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePlaceOrder = () => {
    if (validateForm()) {
      setShowTerms(true);
    }
  };

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    setShowTerms(false);
    processOrder();
  };

  const processOrder = async () => {
    setIsSubmitting(true);
    
    try {
      // Create the order object
      const order = {
        items: [...items],
        totalAmount: subtotal,
        deliveryFee,
        deliveryAddress: `${formData.address}, ${formData.city}, ${formData.postalCode}`,
        gpsCoordinates: formData.latitude && formData.longitude 
          ? { latitude: formData.latitude, longitude: formData.longitude }
          : undefined,
        distance: distance || 0,
        paymentMethod,
        customerInfo: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone
        },
        deliveryTime: selectedDeliveryTime
      };
      
      // Add order to context (this will also trigger the webhook)
      const newOrder = await addOrder(order);
      
      // Clear the cart
      clearCart();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to order confirmation
      navigate(`/orders`);
      
    } catch (error) {
      console.error('Error processing order:', error);
      alert('There was an error processing your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowMapAndLocation = () => {
    setLocationError(null);
    
    // If map is not shown yet, show it
    if (!showMap) {
      setShowMap(true);
    }
    
    // If map is already shown, try to get location
    if (showMap) {
      handleLocationFind();
    }
  };

  const handleLocationFind = () => {
    setIsLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        
        // Update form data with coordinates
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude
        }));
        
        // If map is already shown, update marker position
        if (showMap && googleMapRef.current && markerRef.current) {
          const location = { lat: latitude, lng: longitude };
          googleMapRef.current.setCenter(location);
          markerRef.current.setPosition(location);
          
          // Reverse geocode to get address
          if (window.google && window.google.maps) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                updateLocationData(latitude, longitude, results[0].formatted_address);
              } else {
                updateLocationData(latitude, longitude, `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
              }
            });
          } else {
            updateLocationData(latitude, longitude, `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
        } else {
          // If map is not shown, just update the address field
          setFormData(prev => ({
            ...prev,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          }));
          
          // Calculate distance and delivery fee
          const dist = calculateDistance(
            BUSINESS_LOCATION.lat, 
            BUSINESS_LOCATION.lng, 
            latitude, 
            longitude
          );
          setDistance(dist);
          setDeliveryFee(calculateDeliveryFee(dist));
        }
        
        setIsLocating(false);
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access was denied. Please enable location services in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable. Please try again later.";
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get your location timed out. Please try again.";
            break;
        }
        
        setLocationError(errorMessage);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const renderPaymentForm = () => {
    switch (paymentMethod) {
      case 'card':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700] pl-10"
                  placeholder="1234 5678 9012 3456"
                />
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700] pl-10"
                    placeholder="MM/YY"
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVC
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700] pl-10"
                    placeholder="123"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">Note:</span> Your payment will require verification by our team before your order is processed.
              </p>
            </div>
          </div>
        );
      case 'bank':
        return (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Bank Transfer Details</span>
            </div>
            <div className="space-y-2">
              <p><strong>Bank:</strong> Bangkok Bank</p>
              <p><strong>Account Name:</strong> Tool2U Co., Ltd.</p>
              <p><strong>Account Number:</strong> 731-0-146746</p>
            </div>
            <p className="text-sm text-gray-600">
              Please transfer the exact amount and send us the transfer slip through WhatsApp for faster verification.
            </p>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">Note:</span> Your order will be processed after we verify your payment.
              </p>
            </div>
          </div>
        );
      case 'promptpay':
        return (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg text-center">
            <QrCode className="w-8 h-8 mx-auto text-gray-600" />
            <img 
              src="https://imgur.com/f6f79fe8-3977-4cbf-b1e9-4895ebf7e805" 
              alt="PromptPay QR Code"
              className="max-w-[200px] mx-auto"
            />
            <p className="text-sm text-gray-600">
              Scan this QR code with your banking app to pay via PromptPay
            </p>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">Note:</span> Your order will be processed after we verify your payment.
              </p>
            </div>
          </div>
        );
      case 'cod':
        return (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Cash on Delivery</span>
            </div>
            <p className="text-sm text-gray-600">
              Pay in cash when your tools are delivered. Please prepare the exact amount.
            </p>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <span className="font-medium">Note:</span> Cash on Delivery orders are processed immediately without payment verification.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Helper function to render map loading state
  const renderMapLoadingState = () => {
    switch (mapLoadingState) {
      case 'loading':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
            <Loader2 className="w-10 h-10 animate-spin text-gray-400 mb-3" />
            <p className="text-gray-500">Loading Google Maps...</p>
          </div>
        );
      case 'error':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-4">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
            <p className="text-red-500 font-medium text-center">Failed to load Google Maps</p>
            <p className="text-gray-500 text-center mt-2">Please check your internet connection and try again</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  if (items.length === 0) {
    return <div className="pt-20 text-center">Loading...</div>;
  }

  return (
    <div className="pt-20">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Checkout</h1>
          <Link
            to="/basket"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Cart
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Form */}
          <div className="flex-1">
            {/* Delivery Information */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-bold mb-4">Delivery Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700] ${
                      formErrors.firstName ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700] ${
                      formErrors.lastName ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700] ${
                      formErrors.email ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700] ${
                      formErrors.phone ? 'border-red-500' : ''
                    }`}
                    placeholder="e.g., 0933880630"
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                  )}
                </div>
                
                {/* Location Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Location <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="address-input"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700] ${
                        formErrors.address ? 'border-red-500' : ''
                      }`}
                      placeholder="Enter your address or select on map"
                    />
                  </div>
                  
                  {/* Unified Map & Location Button */}
                  <div className="mt-2">
                    <Button
                      onClick={handleShowMapAndLocation}
                      variant="primary"
                      className="w-full flex items-center justify-center gap-2 py-3"
                      disabled={isLocating || mapLoadingState === 'loading'}
                    >
                      {mapLoadingState === 'loading' ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Loading Maps...</span>
                        </>
                      ) : isLocating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Finding Your Location...</span>
                        </>
                      ) : showMap ? (
                        <>
                          <Navigation className="w-5 h-5" />
                          <span>Use My Current Location</span>
                        </>
                      ) : (
                        <>
                          <Map className="w-5 h-5" />
                          <span>Show Map & Use My Location</span>
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {formErrors.address && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.address}</p>
                  )}
                  {locationError && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <p>{locationError}</p>
                    </div>
                  )}
                  
                  {/* Google Maps */}
                  {showMap && (
                    <div className="mt-4 rounded-lg overflow-hidden border border-gray-300">
                      <div 
                        ref={mapRef} 
                        className="w-full h-[350px]"
                      >
                        {renderMapLoadingState()}
                      </div>
                      {distance !== null && (
                        <div className="bg-gray-50 p-4 text-sm">
                          <p className="font-medium text-base">
                            Distance from Tool2U: {distance.toFixed(1)} km
                          </p>
                          <p className="text-gray-600 mt-1">
                            Delivery Fee: ฿{deliveryFee.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            <span className="font-medium">Tip:</span> You can drag the red marker to adjust your exact delivery location.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700] ${
                      formErrors.city ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.city && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.city}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700] ${
                      formErrors.postalCode ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.postalCode && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.postalCode}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Delivery Time <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedDeliveryTime}
                    onChange={(e) => setSelectedDeliveryTime(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                  >
                    <option value="">Select a time slot</option>
                    {deliveryTimeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                  {!selectedDeliveryTime && (
                    <p className="mt-1 text-sm text-red-600">Please select a delivery time</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Payment Method Selection */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-bold mb-4">Payment Method <span className="text-red-500">*</span></h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  type="button"
                  className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-colors ${
                    paymentMethod === 'card' ? 'border-[#FFD700] bg-[#FFD700]/10' : 'hover:border-gray-400'
                  }`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <CreditCard className="w-6 h-6" />
                  <span>Credit Card</span>
                </button>
                <button
                  type="button"
                  className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-colors ${
                    paymentMethod === 'bank' ? 'border-[#FFD700] bg-[#FFD700]/10' : 'hover:border-gray-400'
                  }`}
                  onClick={() => setPaymentMethod('bank')}
                >
                  <Building2 className="w-6 h-6" />
                  <span>Bank Transfer</span>
                </button>
                <button
                  type="button"
                  className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-colors ${
                    paymentMethod === 'promptpay' ? 'border-[#FFD700] bg-[#FFD700]/10' : 'hover:border-gray-400'
                  }`}
                  onClick={() => setPaymentMethod('promptpay')}
                >
                  <QrCode className="w-6 h-6" />
                  <span>PromptPay</span>
                </button>
                <button
                  type="button"
                  className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-colors ${
                    paymentMethod === 'cod' ? 'border-[#FFD700] bg-[#FFD700]/10' : 'hover:border-gray-400'
                  }`}
                  onClick={() => setPaymentMethod('cod')}
                >
                  <Wallet className="w-6 h-6" />
                  <span>Cash on Delivery</span>
                </button>
              </div>
              
              {/* Payment Method Form */}
              <div className="mt-6">
                {renderPaymentForm()}
              </div>
              
              {!paymentMethod && (
                <p className="mt-2 text-sm text-red-600">Please select a payment method</p>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:w-96">
            <div className="bg-white p-6 rounded-lg shadow-md sticky top-24">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              {/* Items */}
              <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 pb-3 border-b">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.brand}</p>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm">
                          ฿{item.price.toLocaleString()} × {item.quantity} × {item.days} day{item.days > 1 ? 's' : ''}
                        </span>
                        <span className="font-medium">
                          ฿{(item.price * item.quantity * item.days).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Totals */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>฿{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (7%)</span>
                  <span>฿{tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span>฿{deliveryFee.toLocaleString()}</span>
                  {distance !== null && (
                    <span className="text-xs text-gray-500">({distance.toFixed(1)} km)</span>
                  )}
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>฿{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {/* Place Order Button */}
              <button 
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full bg-[#FFD700] text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-[#FFE44D] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Place Order'
                )}
              </button>
              
              <Link
                to="/tools"
                className="w-full mt-4 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors block text-center"
              >
                Continue Shopping
              </Link>
              
              <div className="mt-6 text-sm text-gray-500 space-y-2">
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>Your payment information is secure and encrypted</p>
                </div>
                {paymentMethod && paymentMethod !== 'cod' && (
                  <div className="flex items-start gap-2 text-yellow-700 bg-yellow-50 p-2 rounded">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>Orders will be processed after payment verification</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Terms and Conditions</h2>
              <div className="prose prose-sm">
                <h3 className="text-xl font-bold">TOOL2U TERMS AND CONDITIONS</h3>
                
                <h4 className="font-bold mt-4">1. Introduction</h4>
                <p>Welcome to Tool2U! These Terms and Conditions govern your use of our tool rental services, including rental agreements, payments, deposits, delivery, and returns. By using our service, you agree to comply with these terms.</p>

                <h4 className="font-bold mt-4">2. Rental Eligibility</h4>
                <ul className="list-disc pl-5">
                  <li>Customers must be at least 18 years old to rent tools.</li>
                  <li>A valid government-issued ID and a payment method are required.</li>
                  <li>Tool2U reserves the right to refuse service at our discretion.</li>
                </ul>

                <h4 className="font-bold mt-4">3. Rental Period & Extensions</h4>
                <ul className="list-disc pl-5">
                  <li>Rental duration is selected at checkout and starts from the time of delivery.</li>
                  <li>Extensions must be requested before the due date and are subject to availability.</li>
                  <li>Late returns will incur additional charges.</li>
                </ul>

                <h4 className="font-bold mt-4">4. Payments & Deposits</h4>
                <ul className="list-disc pl-5">
                  <li>All rentals require full prepayment at checkout.</li>
                  <li>A refundable security deposit may be required, which will be held on the customer's card or collected in cash.</li>
                  <li>Deposits are refunded upon tool return, subject to damage inspection.</li>
                </ul>

                <h4 className="font-bold mt-4">5. Delivery & Pickup</h4>
                <ul className="list-disc pl-5">
                  <li>Tools will be delivered to the address provided by the customer.</li>
                  <li>The customer must be available to receive the delivery or arrange for an authorized recipient.</li>
                  <li>Pickup must be scheduled in advance, and tools should be ready for return at the agreed time.</li>
                </ul>

                <h4 className="font-bold mt-4">6. Tool Usage & Responsibility</h4>
                <ul className="list-disc pl-5">
                  <li>Customers are responsible for using tools safely and in accordance with manufacturer guidelines.</li>
                  <li>Tools must not be used for illegal activities or modified in any way.</li>
                  <li>Customers must ensure tools are returned in the same condition as received.</li>
                </ul>

                <h4 className="font-bold mt-4">7. Late Fees & Penalties</h4>
                <ul className="list-disc pl-5">
                  <li>A late fee of ฿500 per day applies for overdue rentals.</li>
                  <li>If a rental exceeds 2 days without return, Tool2U reserves the right to charge the customer's payment method for the full replacement cost.</li>
                </ul>

                <h4 className="font-bold mt-4">8. Damages & Liability</h4>
                <ul className="list-disc pl-5">
                  <li>Customers are responsible for damages beyond normal wear and tear.</li>
                  <li>If a tool is damaged, Tool2U will assess repair costs and deduct them from the deposit or charge the customer accordingly.</li>
                  <li>Lost or stolen tools will be charged at full replacement value.</li>
                </ul>

                <h4 className="font-bold mt-4">9. Cancellations & Refunds</h4>
                <ul className="list-disc pl-5">
                  <li>Cancellations made at least 2 hours before the scheduled delivery are eligible for a full refund.</li>
                  <li>Cancellations after this period may be subject to a cancellation fee.</li>
                  <li>No refunds are issued once the rental period begins.</li>
                </ul>

                <h4 className="font-bold mt-4">10. Dispute Resolution</h4>
                <ul className="list-disc pl-5">
                  <li>Any disputes regarding charges, damages, or terms must be raised within 7 days of rental return.</li>
                  <li>Tool2U reserves the right to make final decisions on disputes.</li>
                </ul>

                <h4 className="font-bold mt-4">11. Changes to Terms</h4>
                <ul className="list-disc pl-5">
                  <li>Tool2U may update these Terms and Conditions at any time. Customers will be notified of significant changes.</li>
                </ul>

                <h4 className="font-bold mt-4">12. Contact Information</h4>
                <p>For any inquiries or support, contact us at Shaunducker1@gmail.com or 0933880630.</p>

                <p className="mt-4 font-bold">By using Tool2U's services, you acknowledge and agree to these Terms and Conditions.</p>
              </div>
              
              <div className="mt-6 flex justify-end gap-4">
                <button
                  onClick={() => setShowTerms(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAcceptTerms}
                  className="px-4 py-2 bg-[#FFD700] text-gray-900 rounded-lg font-bold hover:bg-[#FFE44D]"
                >
                  I Agree
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
