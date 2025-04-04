import React, { createContext, useContext, useState, useEffect } from 'react';
import { calculateDistanceFromBusiness, calculateDeliveryFee } from '../utils/distanceCalculator';
import { webhookService } from '../utils/webhookService';
import { notificationService } from '../utils/notificationService';
import { 
  validateOrder, 
  generateOrderId, 
  ValidationResult, 
  ValidationError,
  initOrderMetrics,
  completeOrderMetrics,
  incrementRetryCount,
  OrderValidationMetrics
} from '../utils/orderValidation';
import { orderLogger } from '../utils/orderLogger';
import { 
  recordNewOrder, 
  recordSuccessfulOrder, 
  recordFailedOrder, 
  getOrderMetrics 
} from '../utils/orderMetrics';

// Define types
export interface GpsCoordinates {
  latitude: number;
  longitude: number;
}

export interface DriverLocation extends GpsCoordinates {
  lastUpdated: string;
}

export interface OrderItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  days?: number;
  image?: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

export interface Order {
  id: string;
  customerInfo: CustomerInfo;
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  gpsCoordinates?: GpsCoordinates;
  distance?: number;
  deliveryFee: number;
  status: string;
  paymentMethod: string;
  orderDate: string;
  deliveryTime?: string;
  estimatedDelivery?: string;
  driverLocation?: DriverLocation;
  notificationSent?: boolean;
  validationResult?: ValidationResult;
  metrics?: OrderValidationMetrics;
  retryCount?: number;
  processingTime?: number;
  onOurWayNotificationSent?: boolean;
}

interface OrderContextType {
  orders: Order[];
  addOrder: (orderData: Partial<Order>) => Promise<Order>;
  getOrderById: (id: string) => Order | undefined;
  updateOrderStatus: (id: string, status: string) => void;
  updateDriverLocation: (id: string, latitude: number, longitude: number) => Promise<void>;
  sendTestNotification: (email: string) => Promise<any>;
  verifyPayment: (orderId: string) => void;
  getOrderMetrics: () => any;
  getOrderValidationErrors: (orderId: string) => ValidationError[];
  retryOrderProcessing: (orderId: string) => Promise<boolean>;
  sendTestOnOurWayNotification: (email: string) => Promise<any>;
}

// Create context
const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Sample data for testing
const sampleOrders: Order[] = [
  {
    id: 'ORD-12345',
    customerInfo: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+66123456789'
    },
    items: [
      { id: 'PROD-001', name: 'Power Drill', brand: 'DeWalt', price: 500, quantity: 1 },
      { id: 'PROD-002', name: 'Circular Saw', brand: 'Makita', price: 700, quantity: 1 }
    ],
    totalAmount: 1200,
    deliveryAddress: '123 Main St, Bangkok, Thailand',
    gpsCoordinates: { latitude: 13.756331, longitude: 100.501765 },
    distance: 15.3,
    deliveryFee: 150,
    status: 'pending',
    paymentMethod: 'Credit Card',
    orderDate: '2023-05-15T08:30:00Z'
  },
  {
    id: 'ORD-67890',
    customerInfo: {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+66987654321'
    },
    items: [
      { id: 'PROD-003', name: 'Ladder', brand: 'Werner', price: 1200, quantity: 1 }
    ],
    totalAmount: 1200,
    deliveryAddress: '456 Park Ave, Chiang Mai, Thailand',
    gpsCoordinates: { latitude: 18.788220, longitude: 98.985933 },
    distance: 8.7,
    deliveryFee: 100,
    status: 'pending',
    paymentMethod: 'Cash on Delivery',
    orderDate: '2023-05-14T10:15:00Z'
  },
  {
    id: 'ORD-24680',
    customerInfo: {
      name: 'Robert Johnson',
      email: 'robert.j@example.com',
      phone: '+66234567890'
    },
    items: [
      { id: 'PROD-004', name: 'Chainsaw', brand: 'Stihl', price: 1500, quantity: 1 },
      { id: 'PROD-005', name: 'Safety Helmet', brand: 'MSA', price: 300, quantity: 1 }
    ],
    totalAmount: 1800,
    deliveryAddress: '789 River Rd, Phuket, Thailand',
    gpsCoordinates: { latitude: 7.878978, longitude: 98.398392 },
    distance: 12.4,
    deliveryFee: 120,
    status: 'pending',
    paymentMethod: 'Bank Transfer',
    orderDate: '2023-05-16T09:45:00Z'
  }
];

// Provider component
export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(sampleOrders);

  // Add a new order with validation
  const addOrder = async (orderData: Partial<Order>): Promise<Order> => {
    // Record new order in metrics
    recordNewOrder();
    
    // Initialize metrics for this order
    const metrics = initOrderMetrics();
    
    // Generate a unique order ID
    const id = generateOrderId();
    
    // Create a new order object with defaults
    const newOrder: Order = {
      id,
      customerInfo: orderData.customerInfo || {
        name: '',
        email: '',
        phone: ''
      },
      items: orderData.items || [],
      totalAmount: orderData.totalAmount || 0,
      deliveryAddress: orderData.deliveryAddress || '',
      gpsCoordinates: orderData.gpsCoordinates,
      distance: orderData.distance,
      deliveryFee: orderData.deliveryFee || 0,
      status: 'pending',
      paymentMethod: orderData.paymentMethod || '',
      orderDate: new Date().toISOString(),
      deliveryTime: orderData.deliveryTime,
      metrics
    };
    
    // Log order creation
    orderLogger.orderCreated(id, newOrder);
    
    // Validate the order
    const validationResult = validateOrder(newOrder);
    newOrder.validationResult = validationResult;
    
    // Update metrics based on validation result
    const updatedMetrics = completeOrderMetrics(
      metrics,
      validationResult.isValid,
      validationResult.errors.length
    );
    newOrder.metrics = updatedMetrics;
    newOrder.processingTime = updatedMetrics.processingDuration || 0;
    
    if (validationResult.isValid) {
      // Order is valid, proceed with processing
      orderLogger.orderValidated(id, validationResult);
      
      // Set appropriate status based on payment method
      if (['bank', 'promptpay'].includes(newOrder.paymentMethod)) {
        newOrder.status = 'payment_verification';
      } else if (newOrder.paymentMethod === 'cod') {
        newOrder.status = 'processing';
      } else {
        // For credit card, we'd normally process payment here
        // For demo purposes, we'll just set it to processing
        newOrder.status = 'processing';
      }
      
      // Record successful order in metrics
      recordSuccessfulOrder(
        updatedMetrics.processingDuration || 0,
        newOrder.status,
        newOrder.paymentMethod
      );
      
      // Add order to state
      setOrders(prevOrders => [...prevOrders, newOrder]);
      
      // Send webhook notification for new order
      try {
        await webhookService.sendOrderWebhook(newOrder);
        orderLogger.info(id, 'Order webhook sent successfully');
      } catch (error) {
        orderLogger.error(id, 'Failed to send order webhook', error);
      }
      
      return newOrder;
    } else {
      // Order is invalid, log errors
      orderLogger.orderValidationFailed(id, validationResult);
      
      // Record failed order in metrics
      recordFailedOrder(
        updatedMetrics.processingDuration || 0,
        validationResult.errors.map(err => err.code)
      );
      
      // For demo purposes, we'll still add the order to state but mark it as failed
      newOrder.status = 'validation_failed';
      setOrders(prevOrders => [...prevOrders, newOrder]);
      
      // In a real application, you might throw an error here
      // throw new Error('Order validation failed');
      return newOrder;
    }
  };

  // Get order by ID
  const getOrderById = (id: string) => {
    return orders.find(order => order.id === id);
  };

  // Update order status with validation and logging
  const updateOrderStatus = (id: string, status: string) => {
    setOrders(prevOrders => 
      prevOrders.map(order => {
        if (order.id === id) {
          // Log status change
          orderLogger.orderStatusChanged(id, order.status, status);
          
          const updatedOrder = { ...order, status };
          
          // If status is changed to "on our way", send on our way notification
          if (status === 'on our way' && !order.onOurWayNotificationSent) {
            webhookService.sendOnOurWayNotification(updatedOrder)
              .then(() => {
                orderLogger.info(id, 'On Our Way notification sent');
                // Mark notification as sent
                setOrders(prevOrders => 
                  prevOrders.map(o => 
                    o.id === id ? { ...o, onOurWayNotificationSent: true } : o
                  )
                );
              })
              .catch(error => {
                orderLogger.error(id, 'Failed to send On Our Way notification', error);
              });
          }
          
          // If status is changed to "delivered", send delivery notification
          if (status === 'delivered') {
            notificationService.sendDeliveryNotification(updatedOrder)
              .then(() => {
                orderLogger.info(id, 'Delivery notification sent');
              })
              .catch(error => {
                orderLogger.error(id, 'Failed to send delivery notification', error);
              });
          }
          
          // Send webhook for status update
          webhookService.sendOrderWebhook(updatedOrder)
            .then(() => {
              orderLogger.info(id, 'Status update webhook sent');
            })
            .catch(error => {
              orderLogger.error(id, 'Failed to send status update webhook', error);
            });
          
          return updatedOrder;
        }
        return order;
      })
    );
  };

  // Update driver location and process notifications
  const updateDriverLocation = async (id: string, latitude: number, longitude: number) => {
    const now = new Date().toISOString();
    
    // Find the order
    const order = getOrderById(id);
    if (!order) {
      orderLogger.error(id, 'Order not found for driver location update');
      return;
    }
    
    // Update driver location
    const updatedOrder: Order = {
      ...order,
      driverLocation: {
        latitude,
        longitude,
        lastUpdated: now
      }
    };
    
    // Process notification if customer has GPS coordinates
    if (updatedOrder.gpsCoordinates) {
      try {
        const { notified, distance } = await notificationService.processLocationUpdate(
          updatedOrder,
          { latitude, longitude }
        );
        
        // Mark notification as sent if triggered
        if (notified) {
          updatedOrder.notificationSent = true;
          orderLogger.info(id, `Driver proximity notification sent, distance: ${distance.toFixed(2)}km`);
        }
      } catch (error) {
        orderLogger.error(id, 'Failed to process location update', error);
      }
    }
    
    // Update order in state
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === id ? updatedOrder : order
      )
    );
    
    // Send webhook update
    try {
      await webhookService.sendOrderWebhook(updatedOrder);
      orderLogger.info(id, 'Driver location webhook sent');
    } catch (error) {
      orderLogger.error(id, 'Failed to send driver location webhook', error);
    }
  };

  // Send test notification
  const sendTestNotification = async (email: string) => {
    try {
      const result = await notificationService.sendTestNotification(email);
      orderLogger.info('TEST', `Test notification sent to ${email}`, result);
      return result;
    } catch (error) {
      orderLogger.error('TEST', `Failed to send test notification to ${email}`, error);
      throw error;
    }
  };

  // Send test "On Our Way" notification
  const sendTestOnOurWayNotification = async (email: string) => {
    try {
      const result = await webhookService.sendTestOnOurWayNotification(email);
      orderLogger.info('TEST', `Test "On Our Way" notification sent to ${email}`, result);
      return result;
    } catch (error) {
      orderLogger.error('TEST', `Failed to send test "On Our Way" notification to ${email}`, error);
      throw error;
    }
  };

  // Verify payment for orders that require verification
  const verifyPayment = (orderId: string) => {
    setOrders(prevOrders => 
      prevOrders.map(order => {
        if (order.id === orderId && order.status === 'payment_verification') {
          // Log payment verification
          orderLogger.info(orderId, 'Payment verified by customer');
          
          // Update order status
          const updatedOrder = { ...order, status: 'processing' };
          
          // Send webhook for payment verification
          webhookService.sendOrderWebhook(updatedOrder)
            .then(() => {
              orderLogger.info(orderId, 'Payment verification webhook sent');
            })
            .catch(error => {
              orderLogger.error(orderId, 'Failed to send payment verification webhook', error);
            });
          
          return updatedOrder;
        }
        return order;
      })
    );
  };

  // Get validation errors for a specific order
  const getOrderValidationErrors = (orderId: string): ValidationError[] => {
    const order = getOrderById(orderId);
    return order?.validationResult?.errors || [];
  };

  // Retry processing a failed order
  const retryOrderProcessing = async (orderId: string): Promise<boolean> => {
    const order = getOrderById(orderId);
    if (!order || order.status !== 'validation_failed') {
      return false;
    }
    
    // Increment retry count
    const updatedMetrics = order.metrics 
      ? incrementRetryCount(order.metrics)
      : initOrderMetrics();
    
    // Re-validate the order
    const validationResult = validateOrder(order);
    
    // Update order with new validation result
    const updatedOrder: Order = {
      ...order,
      validationResult,
      metrics: updatedMetrics,
      retryCount: (order.retryCount || 0) + 1
    };
    
    if (validationResult.isValid) {
      // Order is now valid, update status
      updatedOrder.status = 'pending';
      
      // Log successful retry
      orderLogger.info(orderId, 'Order validation retry successful');
      
      // Update order in state
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === orderId ? updatedOrder : o)
      );
      
      // Send webhook for retry success
      try {
        await webhookService.sendOrderWebhook(updatedOrder);
      } catch (error) {
        orderLogger.error(orderId, 'Failed to send retry webhook', error);
      }
      
      return true;
    } else {
      // Order is still invalid
      orderLogger.warning(orderId, 'Order validation retry failed', validationResult);
      
      // Update order in state with new validation errors
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === orderId ? updatedOrder : o)
      );
      
      return false;
    }
  };

  // Context value
  const value = {
    orders,
    addOrder,
    getOrderById,
    updateOrderStatus,
    updateDriverLocation,
    sendTestNotification,
    verifyPayment,
    getOrderMetrics,
    getOrderValidationErrors,
    retryOrderProcessing,
    sendTestOnOurWayNotification
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

// Custom hook for using the order context
export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
