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

  // Add a new order
  const addOrder = async (order: Order): Promise<void> => {
    // Generate a unique ID if not provided
    if (!order.id) {
      order.id = `ORD-${Date.now().toString().slice(-6)}`;
    }
    
    // Set order date if not provided
    if (!order.orderDate) {
      order.orderDate = new Date().toISOString();
    }
    
    // Set initial status if not provided
    if (!order.status) {
      order.status = 'pending';
    }
    
    // Calculate distance if GPS coordinates are provided
    if (order.gpsCoordinates) {
      // Business location (Koh Samui)
      const businessLocation = { latitude: 9.751085, longitude: 99.975936 };
      order.distance = calculateDistance(
        businessLocation.latitude,
        businessLocation.longitude,
        order.gpsCoordinates.latitude,
        order.gpsCoordinates.longitude
      );
    }
    
    // Update orders state
    setOrders(prevOrders => [...prevOrders, order]);
    
    // Send webhook notification
    try {
      await webhookService.sendOrderWebhook(order);
      console.log(`Webhook sent for new order ${order.id}`);
    } catch (error) {
      console.error("Failed to send webhook for new order:", error);
    }
  };

  // Update an existing order
  const updateOrder = async (orderId: string, updatedOrder: Partial<Order>): Promise<void> => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, ...updatedOrder } : order
      )
    );
    
    // Get the updated order
    const updatedOrderFull = orders.find(order => order.id === orderId);
    
    if (updatedOrderFull) {
      // Send webhook notification for significant updates
      if (updatedOrder.status || updatedOrder.driverLocation) {
        try {
          await webhookService.sendOrderWebhook({ ...updatedOrderFull, ...updatedOrder });
          console.log(`Webhook sent for updated order ${orderId}`);
        } catch (error) {
          console.error("Failed to send webhook for order update:", error);
        }
      }
    }
  };

  // Get an order by ID
  const getOrderById = (orderId: string): Order | undefined => {
    return orders.find(order => order.id === orderId);
  };

  // Update driver location for an order
  const updateDriverLocation = async (orderId: string, latitude: number, longitude: number): Promise<void> => {
    const now = new Date().toISOString();
    
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              driverLocation: { 
                latitude, 
                longitude, 
                lastUpdated: now 
              } 
            } 
          : order
      )
    );
    
    // Get the updated order
    const updatedOrder = orders.find(order => order.id === orderId);
    
    if (updatedOrder) {
      // Send webhook notification
      try {
        await webhookService.sendOrderWebhook({
          ...updatedOrder,
          driverLocation: { latitude, longitude, lastUpdated: now }
        });
        console.log(`Webhook sent for driver location update for order ${orderId}`);
      } catch (error) {
        console.error("Failed to send webhook for driver location update:", error);
      }
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, status: string): Promise<void> => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status } : order
      )
    );
    
    // Get the updated order
    const updatedOrder = orders.find(order => order.id === orderId);
    
    if (updatedOrder) {
      // Send webhook notification
      try {
        await webhookService.sendOrderWebhook({ ...updatedOrder, status });
        console.log(`Webhook sent for status update for order ${orderId}`);
      } catch (error) {
        console.error("Failed to send webhook for status update:", error);
      }
    }
  };

  // Verify payment for an order
  const verifyPayment = async (orderId: string): Promise<void> => {
    // Find the order
    const order = orders.find(order => order.id === orderId);
    
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    // Update order status from payment_verification to processing
    if (order.status === 'payment_verification') {
      await updateOrderStatus(orderId, 'processing');
    }
  };

  return (
    <OrderContext.Provider value={{ 
      orders, 
      addOrder, 
      updateOrder, 
      getOrderById,
      updateDriverLocation,
      updateOrderStatus,
      verifyPayment
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

// Generate sample orders for development
function generateSampleOrders(): Order[] {
  return [
    {
      id: 'ORD-123456',
      customerInfo: {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '+66123456789'
      },
      items: [
        {
          id: 'ITEM-001',
          name: 'Cordless Drill',
          brand: 'DeWalt',
          quantity: 1,
          price: 500,
          days: 3
        },
        {
          id: 'ITEM-002',
          name: 'Circular Saw',
          brand: 'Makita',
          quantity: 1,
          price: 350,
          days: 2
        }
      ],
      totalAmount: 2200,
      deliveryFee: 100,
      deliveryAddress: '123 Beach Road, Koh Samui, Thailand',
      gpsCoordinates: {
        latitude: 9.756331,
        longitude: 99.981765
      },
      distance: 5.2,
      status: 'processing',
      orderDate: '2023-06-15T10:30:00Z',
      estimatedDelivery: '2023-06-16T14:00:00Z',
      deliveryTime: '14:00-18:00',
      paymentMethod: 'Credit Card'
    },
    {
      id: 'ORD-789012',
      customerInfo: {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '+66987654321'
      },
      items: [
        {
          id: 'ITEM-003',
          name: 'Jackhammer',
          brand: 'Bosch',
          quantity: 1,
          price: 800,
          days: 1
        }
      ],
      totalAmount: 800,
      deliveryFee: 150,
      deliveryAddress: '456 Chaweng Beach, Koh Samui, Thailand',
      gpsCoordinates: {
        latitude: 9.531639,
        longitude: 100.071617
      },
      distance: 8.7,
      status: 'pending',
      orderDate: '2023-06-16T09:15:00Z',
      estimatedDelivery: '2023-06-17T10:00:00Z',
      deliveryTime: '10:00-14:00',
      paymentMethod: 'Cash on Delivery'
    },
    {
      id: 'ORD-345678',
      customerInfo: {
        name: 'David Lee',
        email: 'david@example.com',
        phone: '+66555666777'
      },
      items: [
        {
          id: 'ITEM-004',
          name: 'Concrete Mixer',
          brand: 'Hilti',
          quantity: 1,
          price: 1200,
          days: 5
        },
        {
          id: 'ITEM-005',
          name: 'Ladder',
          brand: 'Werner',
          quantity: 2,
          price: 300,
          days: 5
        }
      ],
      totalAmount: 7200,
      deliveryFee: 200,
      deliveryAddress: '789 Lamai Beach, Koh Samui, Thailand',
      gpsCoordinates: {
        latitude: 9.473123,
        longitude: 100.043887
      },
      distance: 12.3,
      status: 'completed',
      orderDate: '2023-06-10T14:45:00Z',
      estimatedDelivery: '2023-06-11T12:00:00Z',
      deliveryTime: '12:00-16:00',
      paymentMethod: 'Bank Transfer'
    },
    {
      id: 'ORD-901234',
      customerInfo: {
        name: 'Emma Wilson',
        email: 'emma@example.com',
        phone: '+66111222333'
      },
      items: [
        {
          id: 'ITEM-006',
          name: 'Generator',
          brand: 'Honda',
          quantity: 1,
          price: 1500,
          days: 2
        }
      ],
      totalAmount: 3000,
      deliveryFee: 250,
      deliveryAddress: '101 Bophut Beach, Koh Samui, Thailand',
      gpsCoordinates: {
        latitude: 9.559489,
        longitude: 100.059082
      },
      distance: 6.8,
      status: 'on-the-way',
      orderDate: '2023-06-17T11:20:00Z',
      estimatedDelivery: '2023-06-18T13:00:00Z',
      deliveryTime: '13:00-17:00',
      paymentMethod: 'Credit Card',
      driverLocation: {
        latitude: 9.551085,
        longitude: 100.051936,
        lastUpdated: '2023-06-18T12:30:00Z'
      }
    },
    {
      id: 'ORD-567890',
      customerInfo: {
        name: 'Michael Brown',
        email: 'michael@example.com',
        phone: '+66444555666'
      },
      items: [
        {
          id: 'ITEM-007',
          name: 'Pressure Washer',
          brand: 'Karcher',
          quantity: 1,
          price: 600,
          days: 3
        },
        {
          id: 'ITEM-008',
          name: 'Nail Gun',
          brand: 'DeWalt',
          quantity: 1,
          price: 450,
          days: 3
        }
      ],
      totalAmount: 3150,
      deliveryFee: 150,
      deliveryAddress: '202 Maenam Beach, Koh Samui, Thailand',
      gpsCoordinates: {
        latitude: 9.571210,
        longitude: 99.987297
      },
      distance: 4.5,
      status: 'delivered',
      orderDate: '2023-06-14T16:10:00Z',
      estimatedDelivery: '2023-06-15T11:00:00Z',
      deliveryTime: '11:00-15:00',
      paymentMethod: 'Cash on Delivery'
    },
    {
      id: 'ORD-246810',
      customerInfo: {
        name: 'Lisa Chen',
        email: 'lisa@example.com',
        phone: '+66777888999'
      },
      items: [
        {
          id: 'ITEM-009',
          name: 'Floor Sander',
          brand: 'Makita',
          quantity: 1,
          price: 750,
          days: 2
        }
      ],
      totalAmount: 1500,
      deliveryFee: 180,
      deliveryAddress: '303 Choeng Mon Beach, Koh Samui, Thailand',
      gpsCoordinates: {
        latitude: 9.583456,
        longitude: 100.082345
      },
      distance: 7.1,
      status: 'payment_verification',
      orderDate: '2023-06-18T13:25:00Z',
      estimatedDelivery: '2023-06-19T15:00:00Z',
      deliveryTime: '15:00-19:00',
      paymentMethod: 'Bank Transfer'
    }
  ];
}
