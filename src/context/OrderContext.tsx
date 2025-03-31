import React, { createContext, useContext, useState, useEffect } from 'react';
import { calculateDistance } from '../utils/distanceCalculator';
import { webhookService } from '../utils/webhookService';

// Define types
export interface GpsCoordinates {
  latitude: number;
  longitude: number;
}

export interface DriverLocation {
  latitude: number;
  longitude: number;
  lastUpdated: string;
}

export interface OrderItem {
  id?: string;
  name: string;
  brand?: string;
  quantity: number;
  price: number;
  days?: number;
}

export interface CustomerInfo {
  name: string;
  email?: string;
  phone: string;
}

export interface Order {
  id: string;
  customerInfo: CustomerInfo;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  deliveryAddress: string;
  gpsCoordinates?: GpsCoordinates;
  distance?: number;
  status: string;
  orderDate: string;
  estimatedDelivery?: string;
  deliveryTime?: string;
  paymentMethod?: string;
  driverLocation?: DriverLocation;
  trackMyOrder?: string;
}

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Order) => Promise<void>;
  updateOrder: (orderId: string, updatedOrder: Partial<Order>) => Promise<void>;
  getOrderById: (orderId: string) => Order | undefined;
  updateDriverLocation: (orderId: string, latitude: number, longitude: number) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  verifyPayment: (orderId: string) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);

  // Load orders from localStorage on initial render
  useEffect(() => {
    const storedOrders = localStorage.getItem('orders');
    if (storedOrders) {
      setOrders(JSON.parse(storedOrders));
    } else {
      // If no orders in localStorage, initialize with sample data
      const sampleOrders = generateSampleOrders();
      setOrders(sampleOrders);
      localStorage.setItem('orders', JSON.stringify(sampleOrders));
    }
  }, []);

  // Save orders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  // Add a 'Track My Order' feature to all orders
  const addTrackMyOrderFeature = (order: Order): Order => {
    return {
      ...order,
      trackMyOrder: `https://example.com/track-order/${order.id}`
    };
  };

  // Update orders state to include 'Track My Order' feature
  useEffect(() => {
    setOrders(prevOrders => prevOrders.map(addTrackMyOrderFeature));
  }, []);

  // Add a new order
  const addOrder = async (order: Order) => {
    const newOrder = addTrackMyOrderFeature(order);
    setOrders(prevOrders => [...prevOrders, newOrder]);
    localStorage.setItem('orders', JSON.stringify([...orders, newOrder]));
  };

  // Update an existing order
  const updateOrder = async (orderId: string, updatedOrder: Partial<Order>) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, ...updatedOrder } : order
      )
    );
    localStorage.setItem('orders', JSON.stringify(orders));
  };

  // Get an order by ID
  const getOrderById = (orderId: string): Order | undefined => {
    return orders.find(order => order.id === orderId);
  };

  // Update driver location for an order
  const updateDriverLocation = async (orderId: string, latitude: number, longitude: number) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId
        ? {
            ...order,
            driverLocation: { latitude, longitude, lastUpdated: new Date().toISOString() }
          }
        : order
    );
    setOrders(updatedOrders);
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, status: string) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId ? { ...order, status } : order
    );
    setOrders(updatedOrders);
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
  };

  // Verify payment for an order
  const verifyPayment = async (orderId: string) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId ? { ...order, status: 'Payment Verified' } : order
    );
    setOrders(updatedOrders);
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        addOrder,
        updateOrder,
        getOrderById,
        updateDriverLocation,
        updateOrderStatus,
        verifyPayment
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

export const useOrders = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

// Sample data generation function
const generateSampleOrders = (): Order[] => {
  return [
    {
      id: '1',
      customerInfo: { name: 'John Doe', phone: '1234567890' },
      items: [
        { id: '1', name: 'Item 1', quantity: 1, price: 100 },
        { id: '2', name: 'Item 2', quantity: 2, price: 200 }
      ],
      totalAmount: 500,
      deliveryFee: 50,
      deliveryAddress: '123 Main St',
      status: 'Pending',
      orderDate: new Date().toISOString()
    }
  ];
};
