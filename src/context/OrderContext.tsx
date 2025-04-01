import React, { createContext, useContext, useState, useEffect } from 'react';
import { calculateDistanceFromBusiness, calculateDeliveryFee } from '../utils/distanceCalculator';
import { webhookService } from '../utils/webhookService';
import { notificationService } from '../utils/notificationService';

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
}

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Order) => void;
  getOrderById: (id: string) => Order | undefined;
  updateOrderStatus: (id: string, status: string) => void;
  updateDriverLocation: (id: string, latitude: number, longitude: number) => Promise<void>;
  sendTestNotification: (email: string) => Promise<any>;
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
      { id: 'ITEM-1', name: 'Power Drill', brand: 'DeWalt', price: 500, quantity: 1 },
      { id: 'ITEM-2', name: 'Circular Saw', brand: 'Makita', price: 700, quantity: 1 }
    ],
    totalAmount: 1200,
    deliveryAddress: '123 Main St, Bangkok, Thailand',
    gpsCoordinates: { latitude: 13.756331, longitude: 100.501765 },
    distance: 15.3,
    deliveryFee: 150,
    status: 'processing',
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
      { id: 'ITEM-3', name: 'Ladder', brand: 'Werner', price: 1200, quantity: 1 }
    ],
    totalAmount: 1200,
    deliveryAddress: '456 Park Ave, Chiang Mai, Thailand',
    gpsCoordinates: { latitude: 18.788220, longitude: 98.985933 },
    distance: 8.7,
    deliveryFee: 100,
    status: 'delivered',
    paymentMethod: 'Cash on Delivery',
    orderDate: '2023-05-14T10:15:00Z'
  }
];

// Provider component
export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(sampleOrders);

  // Add a new order
  const addOrder = (order: Order) => {
    // Calculate distance and delivery fee if coordinates are provided
    let updatedOrder = { ...order };
    
    if (order.gpsCoordinates) {
      const distance = calculateDistanceFromBusiness(
        order.gpsCoordinates.latitude,
        order.gpsCoordinates.longitude
      );
      
      updatedOrder.distance = distance;
      updatedOrder.deliveryFee = calculateDeliveryFee(distance);
    }
    
    setOrders(prevOrders => [...prevOrders, updatedOrder]);
    
    // Send webhook notification for new order
    webhookService.sendOrderWebhook(updatedOrder)
      .then(() => console.log('Order webhook sent successfully'))
      .catch(error => console.error('Failed to send order webhook:', error));
  };

  // Get order by ID
  const getOrderById = (id: string) => {
    return orders.find(order => order.id === id);
  };

  // Update order status
  const updateOrderStatus = (id: string, status: string) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === id ? { ...order, status } : order
      )
    );
  };

  // Update driver location and process notifications
  const updateDriverLocation = async (id: string, latitude: number, longitude: number) => {
    const now = new Date().toISOString();
    
    // Find the order
    const order = getOrderById(id);
    if (!order) {
      console.error(`Order ${id} not found`);
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
      const { notified, distance } = await notificationService.processLocationUpdate(
        updatedOrder,
        { latitude, longitude }
      );
      
      // Mark notification as sent if triggered
      if (notified) {
        updatedOrder.notificationSent = true;
        console.log(`Notification sent for order ${id} - distance: ${distance.toFixed(2)}km`);
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
    } catch (error) {
      console.error('Failed to send order webhook:', error);
    }
  };

  // Send test notification
  const sendTestNotification = async (email: string) => {
    return await notificationService.sendTestNotification(email);
  };

  // Context value
  const value = {
    orders,
    addOrder,
    getOrderById,
    updateOrderStatus,
    updateDriverLocation,
    sendTestNotification
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
