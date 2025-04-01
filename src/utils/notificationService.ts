import axios from 'axios';
import { Order, GpsCoordinates } from '../context/OrderContext';
import { webhookService } from './webhookService';

interface DriverLocation {
  latitude: number;
  longitude: number;
}

interface NotificationResult {
  notified: boolean;
  distance: number;
}

/**
 * Service for handling customer notifications
 */
export const notificationService = {
  /**
   * Process driver location update and send notification if needed
   * @param order The order being delivered
   * @param driverLocation Current driver location
   * @returns Object with notification status and distance
   */
  processLocationUpdate: async (order: Order, driverLocation: DriverLocation): Promise<NotificationResult> => {
    try {
      // If order has no GPS coordinates or notification was already sent, skip
      if (!order.gpsCoordinates || order.notificationSent) {
        return { notified: false, distance: 0 };
      }
      
      // Calculate distance between driver and customer
      const distance = calculateDistance(
        driverLocation.latitude,
        driverLocation.longitude,
        order.gpsCoordinates.latitude,
        order.gpsCoordinates.longitude
      );
      
      console.log(`Distance to customer for order ${order.id}: ${distance.toFixed(2)}km`);
      
      // If driver is within 1km of customer and notification hasn't been sent yet
      if (distance <= 1.0 && !order.notificationSent) {
        console.log(`Sending arrival notification for order ${order.id}`);
        
        // Send notification via webhook
        await webhookService.sendOrderWebhook({
          ...order,
          status: 'arriving',
          driverLocation: {
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
            lastUpdated: new Date().toISOString()
          }
        });
        
        return { notified: true, distance };
      }
      
      return { notified: false, distance };
    } catch (error) {
      console.error("Error processing location update:", error);
      return { notified: false, distance: 0 };
    }
  },
  
  /**
   * Send a test notification email
   * @param email Email address to send the test notification to
   * @returns Promise resolving to the response or error
   */
  sendTestNotification: async (email: string): Promise<any> => {
    try {
      console.log(`Sending test notification to ${email}`);
      
      // Create a test order with the provided email
      const testOrder: Partial<Order> = {
        id: `TEST-${Date.now().toString().slice(-6)}`,
        customerInfo: {
          name: "Test Customer",
          email: email,
          phone: "+66123456789"
        },
        status: 'arriving',
        deliveryAddress: "123 Test Street, Bangkok, Thailand",
        gpsCoordinates: {
          latitude: 13.756331,
          longitude: 100.501765
        }
      };
      
      // Send notification via webhook
      const response = await webhookService.sendOrderWebhook(testOrder as Order);
      
      return {
        success: true,
        message: `Test notification sent to ${email}`,
        response
      };
    } catch (error) {
      console.error("Error sending test notification:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  },
  
  /**
   * Send delivery confirmation notification
   * @param order The delivered order
   * @returns Promise resolving to the response or error
   */
  sendDeliveryNotification: async (order: Order): Promise<any> => {
    try {
      console.log(`Sending delivery notification for order ${order.id}`);
      
      // Send notification via webhook
      const response = await webhookService.sendOrderWebhook({
        ...order,
        status: 'delivered'
      });
      
      return {
        success: true,
        message: `Delivery notification sent for order ${order.id}`,
        response
      };
    } catch (error) {
      console.error("Error sending delivery notification:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }
};

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
