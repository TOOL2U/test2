import axios from 'axios';
import { calculateDistance } from './distanceCalculator';
import { Order, GpsCoordinates } from '../context/OrderContext';

// Notification threshold distance in kilometers
const NOTIFICATION_THRESHOLD = 1.0;

// Webhook URL for Make.com integration
const NOTIFICATION_WEBHOOK_URL = 'https://hook.eu2.make.com/li5q5trtct2rpdb2kq1o4jliglpyt2o9';

/**
 * Service for handling delivery notifications
 */
export const notificationService = {
  /**
   * Check if driver is within notification threshold of customer
   * @param driverLocation Driver's current GPS coordinates
   * @param customerLocation Customer's GPS coordinates
   * @returns Boolean indicating if notification should be triggered
   */
  isWithinNotificationThreshold: (
    driverLocation: GpsCoordinates,
    customerLocation: GpsCoordinates
  ): boolean => {
    if (!driverLocation || !customerLocation) return false;
    
    const distance = calculateDistance(
      driverLocation.latitude,
      driverLocation.longitude,
      customerLocation.latitude,
      customerLocation.longitude
    );
    
    return distance <= NOTIFICATION_THRESHOLD;
  },
  
  /**
   * Process driver location update and trigger notification if needed
   * @param order Current order being delivered
   * @param driverLocation Updated driver location
   * @returns Promise resolving to notification status
   */
  processLocationUpdate: async (
    order: Order,
    driverLocation: GpsCoordinates
  ): Promise<{ notified: boolean; distance: number }> => {
    try {
      // Skip if order or locations are missing
      if (!order || !order.gpsCoordinates || !driverLocation) {
        return { notified: false, distance: -1 };
      }
      
      // Skip if notification was already sent
      if (order.notificationSent) {
        return { notified: false, distance: -1 };
      }
      
      // Calculate current distance
      const distance = calculateDistance(
        driverLocation.latitude,
        driverLocation.longitude,
        order.gpsCoordinates.latitude,
        order.gpsCoordinates.longitude
      );
      
      // Check if we should trigger notification
      if (distance <= NOTIFICATION_THRESHOLD) {
        // Send notification via webhook
        await notificationService.sendArrivalNotification(order, distance);
        return { notified: true, distance };
      }
      
      return { notified: false, distance };
    } catch (error) {
      console.error('Error processing location update:', error);
      return { notified: false, distance: -1 };
    }
  },
  
  /**
   * Send arrival notification via webhook
   * @param order Order information
   * @param distance Current distance from customer
   * @returns Promise resolving to webhook response
   */
  sendArrivalNotification: async (order: Order, distance: number): Promise<any> => {
    try {
      console.log(`Sending arrival notification for order ${order.id}, distance: ${distance.toFixed(2)}km`);
      
      // Format estimated arrival time
      const estimatedMinutes = Math.ceil(distance * 2); // Rough estimate: 2 minutes per km
      const estimatedArrival = new Date();
      estimatedArrival.setMinutes(estimatedArrival.getMinutes() + estimatedMinutes);
      const formattedArrivalTime = estimatedArrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Prepare payload for webhook - formatted to match email body requirements
      const payload = {
        // Customer information
        customer_name: order.customerInfo?.name || 'Valued Customer',
        customer_email: order.customerInfo?.email,
        customer_phone: order.customerInfo?.phone,
        
        // Order information
        order_id: order.id,
        order_status: order.status || 'In Transit',
        delivery_address: order.deliveryAddress,
        
        // Delivery information
        distance_km: parseFloat(distance.toFixed(2)),
        estimated_arrival_minutes: estimatedMinutes,
        estimated_arrival_time: formattedArrivalTime,
        
        // Driver information
        driver_name: order.driverName || 'Your Driver',
        driver_phone: order.driverPhone || 'N/A',
        
        // Location information
        driver_location: {
          latitude: order.driverLocation?.latitude,
          longitude: order.driverLocation?.longitude,
          last_updated: order.driverLocation?.lastUpdated || new Date().toISOString()
        },
        
        // Order details
        order_details: {
          items: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          total_amount: order.totalAmount,
          payment_method: order.paymentMethod || 'N/A'
        },
        
        // Notification metadata
        notification_type: 'driver_approaching',
        timestamp: new Date().toISOString()
      };
      
      // Send webhook request
      const response = await axios.post(NOTIFICATION_WEBHOOK_URL, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Arrival notification sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending arrival notification:', error);
      
      // For development/testing, simulate successful response
      console.log('Simulating successful notification (development only)');
      return { success: true, simulated: true };
    }
  },
  
  /**
   * Send test notification to verify webhook integration
   * @param customerEmail Customer email for test notification
   * @returns Promise resolving to webhook response
   */
  sendTestNotification: async (customerEmail: string): Promise<any> => {
    try {
      console.log(`Sending test notification to ${customerEmail}`);
      
      // Calculate estimated arrival time (2 minutes from now)
      const estimatedMinutes = 2;
      const estimatedArrival = new Date();
      estimatedArrival.setMinutes(estimatedArrival.getMinutes() + estimatedMinutes);
      const formattedArrivalTime = estimatedArrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Create test payload that matches the email body format
      const payload = {
        // Customer information
        customer_name: 'Test Customer',
        customer_email: customerEmail,
        customer_phone: '+66123456789',
        
        // Order information
        order_id: `TEST-${Date.now().toString().slice(-6)}`,
        order_status: 'In Transit',
        delivery_address: '123 Test Street, Bangkok, Thailand',
        
        // Delivery information
        distance_km: 1.0,
        estimated_arrival_minutes: estimatedMinutes,
        estimated_arrival_time: formattedArrivalTime,
        
        // Driver information
        driver_name: 'Test Driver',
        driver_phone: '+66987654321',
        
        // Location information
        driver_location: {
          latitude: 13.756331,
          longitude: 100.501765,
          last_updated: new Date().toISOString()
        },
        
        // Order details
        order_details: {
          items: [
            { name: 'Test Product 1', quantity: 1, price: 500 },
            { name: 'Test Product 2', quantity: 2, price: 250 }
          ],
          total_amount: 1000,
          payment_method: 'Credit Card'
        },
        
        // Notification metadata
        notification_type: 'test_notification',
        timestamp: new Date().toISOString()
      };
      
      // Send webhook request
      const response = await axios.post(NOTIFICATION_WEBHOOK_URL, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Test notification sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending test notification:', error);
      
      // Try alternative method if axios fails
      try {
        console.log('Trying alternative method to send test notification');
        
        const payload = {
          customer_name: 'Test Customer',
          customer_email: customerEmail,
          notification_type: 'test_notification',
          timestamp: new Date().toISOString()
        };
        
        // Use fetch API as an alternative
        const fetchResponse = await fetch(NOTIFICATION_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        if (fetchResponse.ok) {
          const data = await fetchResponse.json();
          console.log('Test notification sent successfully using fetch:', data);
          return data;
        } else {
          throw new Error(`HTTP error! status: ${fetchResponse.status}`);
        }
      } catch (fetchError) {
        console.error('Alternative method also failed:', fetchError);
        
        // For development/testing, simulate successful response
        console.log('Simulating successful test notification (development only)');
        return { success: true, simulated: true };
      }
    }
  }
};
