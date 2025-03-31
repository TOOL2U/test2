import { useState, useEffect } from 'react';

export interface Product {
  id: number;
  name: string;
  categories: string[];
  description: string;
  voltage?: string;
  specifications?: Record<string, string>;
  imageUrl: string;
  price: number;
  quantity: number;
  deposit: number;
}

// Real product data provided by the user
const getRealProducts = (): Product[] => {
  return [
    {
      id: 1,
      name: "Auto air compressor",
      categories: ["Air Tools"],
      description: "High-quality auto air compressor for various applications",
      voltage: "12",
      specifications: {
        'Voltage': '12V',
        'Power': '600W',
        'Capacity': '200L',
        'Current': '10A',
        'Pressure': '8.5Bar',
        'Flow': '35L/min'
      },
      imageUrl: "https://www.totalbusiness.com/userfiles/1/images/photo/20200730/TTAC1406.JPG",
      price: 560,
      quantity: 1,
      deposit: 100
    },
    {
      id: 2,
      name: "Gasoline grass trimmer and brush cutter",
      categories: ["Garden Tools"],
      description: "Powerful gasoline grass trimmer and brush cutter for garden maintenance",
      voltage: "220",
      specifications: {
        'Voltage': '220V',
        'Power': '1600W',
        'Capacity': '2.5L',
        'Pressure': '150Bar',
        'Dust capacity': '30L'
      },
      imageUrl: "https://www.totalbusiness.com/userfiles/1/images/photo/20200730/TP5434421.jpg",
      price: 690,
      quantity: 2,
      deposit: 200
    },
    {
      id: 3,
      name: "Cordless impact drill",
      categories: ["P20S"],
      description: "Versatile cordless impact drill for various drilling tasks",
      voltage: "20",
      specifications: {
        'Maximum torque': '45NM',
        'Voltage': '20V',
        'Capacity': '0.7L',
        'Current': '2A',
        'Disc diameter': '115mm',
        'Maximum cutting diameter': '18mm',
        'Lumen': '225',
        'Pressure': '5BAR',
        'Dust capacity': '0.7L',
        'Trimmer cutting diameter': '330mm'
      },
      imageUrl: "https://www.totalbusiness.com/userfiles/1/images/photo/20200730/TIDLI20012.png",
      price: 700,
      quantity: 3,
      deposit: 300
    },
    {
      id: 4,
      name: "Steel measuring tape",
      categories: ["Measuring Tools"],
      description: "Durable steel measuring tape for precise measurements",
      voltage: "12",
      specifications: {
        'Voltage': '12V'
      },
      imageUrl: "https://www.totalbusiness.com/website-center/upload/images/50d24ac789254067bdc9603477b7e124.jpg",
      price: 600,
      quantity: 4,
      deposit: 400
    },
    {
      id: 5,
      name: "Inverter MMA welding machine",
      categories: ["Welding Machines"],
      description: "Professional inverter MMA welding machine for welding tasks",
      specifications: {
        'Input voltage(V)': '1~220'
      },
      imageUrl: "https://www.totalbusiness.com/userfiles/1/images/photo/20200730/TW21606.jpg",
      price: 566,
      quantity: 5,
      deposit: 500
    },
    {
      id: 6,
      name: "Knitted&PVC dots gloves",
      categories: ["Safety Products"],
      description: "Comfortable and protective knitted & PVC dots gloves for safety",
      voltage: "11",
      specifications: {},
      imageUrl: "https://www.totalbusiness.com/userfiles/1/images/photo/20200730/TSP11102.jpg",
      price: 654,
      quantity: 6,
      deposit: 600
    },
    {
      id: 7,
      name: "Diamond disc",
      categories: ["Power Tools Accessories"],
      description: "High-quality diamond disc for cutting applications",
      voltage: "220-240",
      specifications: {
        'Current': '300A'
      },
      imageUrl: "https://www.totalbusiness.com/website-center/upload/images/d3b11fdc61e94a0097d6bfe984f2824c.jpg",
      price: 677,
      quantity: 7,
      deposit: 700
    },
    {
      id: 8,
      name: "Gasoline engine",
      categories: ["Generators"],
      description: "Reliable gasoline engine for power generation",
      voltage: "220",
      specifications: {
        'Voltage': '220V',
        'Flow': '100L/min'
      },
      imageUrl: "https://www.totalbusiness.com/userfiles/1/images/photo/20200730/TGEN16821.jpg",
      price: 88,
      quantity: 8,
      deposit: 800
    },
    {
      id: 9,
      name: "Cut off saw",
      categories: ["Bench Tools"],
      description: "Powerful cut off saw for precise cutting",
      voltage: "220",
      specifications: {
        'Voltage': '220V',
        'Power': '2350W',
        'Capacity': '20mm'
      },
      imageUrl: "https://www.totalbusiness.com/userfiles/1/images/photo/20200915231525149/TS92035526.jpg",
      price: 544,
      quantity: 9,
      deposit: 900
    },
    {
      id: 10,
      name: "Lithium-Ion work lamp",
      categories: ["Lamp Series And Socket Series"],
      description: "Bright lithium-ion work lamp for illumination",
      voltage: "20",
      specifications: {
        'Voltage': '20V',
        'Power': '18W',
        'Lumen': '225'
      },
      imageUrl: "https://www.totalbusiness.com/userfiles/1/images/photo/20200921231542987/TWLI2001.jpg",
      price: 340,
      quantity: 10,
      deposit: 1000
    },
    {
      id: 11,
      name: "Gasoline concrete vibrator",
      categories: ["Small Construction Equipment"],
      description: "Efficient gasoline concrete vibrator for construction work",
      voltage: "220-240",
      specifications: {
        'Voltage': '220-240V',
        'Engine power': '4.0kW'
      },
      imageUrl: "https://www.totalbusiness.com/userfiles/1/images/photo/20200730/TP630-1.jpg",
      price: 900,
      quantity: 11,
      deposit: 1100
    },
    {
      id: 12,
      name: "Stand for demolition breaker",
      categories: ["Hand Tools"],
      description: "Sturdy stand for demolition breaker for stability",
      voltage: "220-240",
      specifications: {
        'Voltage': '220-240V',
        'Power': '40W'
      },
      imageUrl: "https://www.totalbusiness.com/userfiles/1/images/photo/20200730/TH220502-S.jpg",
      price: 980,
      quantity: 12,
      deposit: 1200
    },
    {
      id: 13,
      name: "Water pump",
      categories: ["Water Pumps"],
      description: "Efficient water pump for water transfer applications",
      voltage: "220-240",
      specifications: {
        'Voltage': '220-240V',
        'Power': '370W',
        'Rated power': '370W',
        'Current': '10A',
        'Pressure': '1.5bar',
        'Flow': '30L/min'
      },
      imageUrl: "https://www.totalbusiness.com/userfiles/1/images/photo/20200916231520562/TWP137016.jpg",
      price: 760,
      quantity: 13,
      deposit: 1300
    },
    {
      id: 14,
      name: "Cordless 2 pcs combo kit",
      categories: ["Power Tools"],
      description: "Versatile cordless 2-piece combo kit for various tasks",
      voltage: "12",
      specifications: {
        'Maximum torque': '45NM',
        'Voltage': '12V',
        'Capacity': '0.7L',
        'Current': '2A',
        'Disc diameter': '115mm',
        'Maximum cutting diameter': '18mm',
        'Pressure': '5BAR',
        'Dust capacity': '0.7L',
        'Trimmer cutting diameter': '330mm'
      },
      imageUrl: "https://www.totalbusiness.com/userfiles/1/images/photo/20200730/TKLI1201.jpg",
      price: 678,
      quantity: 14,
      deposit: 1400
    }
  ];
};

// This is a service that fetches product data
export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Use the real products data directly
        setProducts(getRealProducts());
        setLoading(false);
      } catch (err) {
        console.error('Error in product service:', err);
        setError('Failed to load products. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  return { products, loading, error };
};

// Export the real products function for testing
export { getRealProducts };
