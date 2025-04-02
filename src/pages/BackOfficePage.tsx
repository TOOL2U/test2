import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import { Product, getRealProducts, saveProductsToStorage } from '../utils/productService';
import { 
  BarChart3, 
  Package, 
  Users, 
  ShoppingCart, 
  Settings, 
  LogOut, 
  AlertTriangle,
  Search,
  Plus,
  Filter,
  RefreshCw,
  ChevronDown,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Image,
  Tag,
  FileText,
  Zap,
  Hash,
  Layers,
  Save
} from 'lucide-react';

// Define types for our dashboard data
interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockItems: number;
}

interface RecentOrder {
  id: string;
  customerName: string;
  date: string;
  amount: number;
  status: 'pending' | 'processing' | 'on-the-way' | 'delivered' | 'completed' | 'payment_verification';
}

interface TopProduct {
  id: string;
  name: string;
  sales: number;
  stock: number;
  price: number;
}

// New product form state interface
interface ProductFormState {
  name: string;
  description: string;
  categories: string[];
  price: number;
  deposit: number;
  quantity: number;
  imageUrl: string;
  voltage?: string;
  specifications: Record<string, string>;
}

// Initial form state
const initialProductForm: ProductFormState = {
  name: '',
  description: '',
  categories: [],
  price: 0,
  deposit: 0,
  quantity: 1,
  imageUrl: '',
  voltage: '',
  specifications: {}
};

const BackOfficePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    lowStockItems: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('last7days');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<{id: string, message: string, type: string}[]>([]);
  
  // Product management state
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddProductModal, setShowAddProductModal] = useState<boolean>(false);
  const [productForm, setProductForm] = useState<ProductFormState>(initialProductForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newSpecKey, setNewSpecKey] = useState<string>('');
  const [newSpecValue, setNewSpecValue] = useState<string>('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', role: '', username: '', password: '' });
  const [users, setUsers] = useState([]);

  const handleAddUser = () => {
    if (!newUser.name || !newUser.role || !newUser.username || !newUser.password) {
      alert('All fields are required to add a new user.');
      return;
    }
  
    const newUserId = users.length > 0 ? Math.max(...users.map(user => user.id)) + 1 : 1;
    const updatedUsers = [...users, { id: newUserId, ...newUser }];
    setUsers(updatedUsers);
  
    // Save to localStorage for authentication
    const storedStaffUsers = JSON.parse(localStorage.getItem('staffUsers') || '[]');
    storedStaffUsers.push({ id: newUserId, ...newUser });
    localStorage.setItem('staffUsers', JSON.stringify(storedStaffUsers));
  
    setShowAddUserModal(false);
    setNewUser({ name: '', role: '', username: '', password: '' });
    alert('New user added successfully!');
  };
  
  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const updatedUsers = users.filter(user => user.id !== userId);
      setUsers(updatedUsers);
      alert('User deleted successfully!');
    }
  };

  const handleEditUser = (userId: number) => {
    const userToEdit = users.find(user => user.id === userId);
    if (userToEdit) {
      setNewUser({ ...userToEdit });
      setShowAddUserModal(true);
    }
  };

  const loadUsersFromStorage = () => {
    const storedStaffUsers = JSON.parse(localStorage.getItem('staffUsers') || '[]');
    setUsers(storedStaffUsers);
  };

  useEffect(() => {
    loadUsersFromStorage();
  }, []);

  // Check if user is authenticated and has appropriate role
  useEffect(() => {
    if (!user) {
      navigate('/staff-login');
      return;
    }
    
    // Check if user has admin or owner role
    const adminRoles = ['admin', 'owner'];
    const isAdmin = user.role && adminRoles.includes(user.role);
    
    if (!isAdmin) {
      navigate('/staff-login');
    }
  }, [user, navigate]);

  // Load dashboard data
  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // In a real application, these would be API calls
        // For demo purposes, we'll use mock data
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get products from our service
        const productData = getRealProducts();
        setProducts(productData);
        
        // Extract unique categories
        const categories = Array.from(
          new Set(productData.flatMap(product => product.categories))
        );
        setAvailableCategories(categories);
        
        // Set mock stats
        setStats({
          totalOrders: 1234,
          totalRevenue: 87650,
          totalCustomers: 856,
          totalProducts: productData.length,
          pendingOrders: 18,
          lowStockItems: 24
        });
        
        // Set mock recent orders
        setRecentOrders([
          { id: 'ORD-7829', customerName: 'John Smith', date: '2023-06-15', amount: 1250, status: 'completed' },
          { id: 'ORD-7830', customerName: 'Sarah Johnson', date: '2023-06-15', amount: 890, status: 'on-the-way' },
          { id: 'ORD-7831', customerName: 'Michael Brown', date: '2023-06-14', amount: 2340, status: 'processing' },
          { id: 'ORD-7832', customerName: 'Emma Wilson', date: '2023-06-14', amount: 760, status: 'pending' },
          { id: 'ORD-7833', customerName: 'James Taylor', date: '2023-06-13', amount: 1890, status: 'payment_verification' }
        ]);
        
        // Set top products based on our product data
        const topProductsData = productData
          .slice(0, 5)
          .map(product => ({
            id: `PRD-${product.id.toString().padStart(3, '0')}`,
            name: product.name,
            sales: Math.floor(Math.random() * 100) + 20, // Random sales number for demo
            stock: product.quantity,
            price: product.price
          }));
        
        setTopProducts(topProductsData);
        
        // Set mock notifications
        setNotifications([
          { id: 'not-1', message: 'Low stock alert: 5 products below threshold', type: 'warning' },
          { id: 'not-2', message: 'New order #ORD-7834 received', type: 'info' },
          { id: 'not-3', message: 'Payment verification required for order #ORD-7833', type: 'alert' }
        ]);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, dateRange]);

  // Load staff users from localStorage on component mount
  useEffect(() => {
    const storedStaffUsers = JSON.parse(localStorage.getItem('staffUsers') || '[]');
    setUsers(storedStaffUsers);
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/staff-login');
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'payment_verification':
        return 'bg-orange-100 text-orange-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'on-the-way':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format status text
  const formatStatus = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'on-the-way':
        return 'On the Way';
      case 'delivered':
        return 'Delivered';
      case 'completed':
        return 'Completed';
      case 'payment_verification':
        return 'Payment Verification';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric values
    if (name === 'price' || name === 'deposit' || name === 'quantity') {
      setProductForm({
        ...productForm,
        [name]: parseFloat(value) || 0
      });
    } else {
      setProductForm({
        ...productForm,
        [name]: value
      });
    }
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // Add a specification to the product
  const handleAddSpecification = () => {
    if (!newSpecKey.trim() || !newSpecValue.trim()) {
      return;
    }
    
    setProductForm({
      ...productForm,
      specifications: {
        ...productForm.specifications,
        [newSpecKey]: newSpecValue
      }
    });
    
    // Clear inputs
    setNewSpecKey('');
    setNewSpecValue('');
  };

  // Remove a specification
  const handleRemoveSpecification = (key: string) => {
    const updatedSpecs = { ...productForm.specifications };
    delete updatedSpecs[key];
    
    setProductForm({
      ...productForm,
      specifications: updatedSpecs
    });
  };

  // Add a category to the product
  const handleAddCategory = () => {
    if (!selectedCategory || productForm.categories.includes(selectedCategory)) {
      return;
    }
    
    setProductForm({
      ...productForm,
      categories: [...productForm.categories, selectedCategory]
    });
    
    // Clear selection
    setSelectedCategory('');
  };

  // Remove a category
  const handleRemoveCategory = (category: string) => {
    setProductForm({
      ...productForm,
      categories: productForm.categories.filter(cat => cat !== category)
    });
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!productForm.name.trim()) {
      errors.name = 'Product name is required';
    }
    
    if (!productForm.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (productForm.categories.length === 0) {
      errors.categories = 'At least one category is required';
    }
    
    if (productForm.price <= 0) {
      errors.price = 'Price must be greater than zero';
    }
    
    if (productForm.deposit < 0) {
      errors.deposit = 'Deposit cannot be negative';
    }
    
    if (productForm.quantity <= 0) {
      errors.quantity = 'Quantity must be greater than zero';
    }
    
    if (!productForm.imageUrl.trim()) {
      errors.imageUrl = 'Image URL is required';
    } else if (!isValidUrl(productForm.imageUrl)) {
      errors.imageUrl = 'Please enter a valid URL';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if URL is valid
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Add a callback to notify other components of product changes
  const notifyProductChange = () => {
    // Trigger a custom event to notify other components
    const event = new CustomEvent('productsUpdated');
    window.dispatchEvent(event);
  };

  // Handle form submission
  const handleSubmitProduct = () => {
    if (!validateForm()) {
      return;
    }

    const newProduct: Product = {
      id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
      name: productForm.name,
      description: productForm.description,
      categories: productForm.categories,
      price: productForm.price,
      deposit: productForm.deposit,
      quantity: productForm.quantity,
      imageUrl: productForm.imageUrl,
      voltage: productForm.voltage,
      specifications: productForm.specifications
    };

    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    saveProductsToStorage(updatedProducts); // Save to local storage

    setStats({
      ...stats,
      totalProducts: stats.totalProducts + 1
    });

    setNotifications([
      { 
        id: `not-${Date.now()}`, 
        message: `Product "${newProduct.name}" has been added successfully`, 
        type: 'info' 
      },
      ...notifications
    ]);

    setShowAddProductModal(false);
    setProductForm(initialProductForm);
    setFormErrors({});

    notifyProductChange(); // Notify other components

    alert(`Product "${newProduct.name}" has been added successfully!`);
  };

  const handleDeleteProduct = (productId: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const updatedProducts = products.filter(product => product.id !== productId);
      setProducts(updatedProducts);
      saveProductsToStorage(updatedProducts); // Save to local storage

      setStats({
        ...stats,
        totalProducts: stats.totalProducts - 1
      });

      notifyProductChange(); // Notify other components

      alert('Product deleted successfully!');
    }
  };

  // Reset form
  const resetForm = () => {
    setProductForm(initialProductForm);
    setFormErrors({});
    setNewSpecKey('');
    setNewSpecValue('');
    setSelectedCategory('');
  };

  // Open add product modal
  const openAddProductModal = () => {
    resetForm();
    setShowAddProductModal(true);
  };

  const handleEditProduct = (productId: number) => {
    const productToEdit = products.find(product => product.id === productId);
    if (productToEdit) {
      setProductForm({ ...productToEdit });
      setShowAddProductModal(true);
    }
  };

  // If not authenticated, the useEffect will redirect to login page
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">E-Commerce Admin</h1>
          <p className="text-sm text-gray-600">Welcome, {user.name || user.username}</p>
        </div>
        
        <nav className="mt-4">
          <ul>
            <li>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center w-full px-4 py-3 text-left ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <BarChart3 className="w-5 h-5 mr-3" />
                Dashboard
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('orders')}
                className={`flex items-center w-full px-4 py-3 text-left ${activeTab === 'orders' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <ShoppingCart className="w-5 h-5 mr-3" />
                Orders
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('products')}
                className={`flex items-center w-full px-4 py-3 text-left ${activeTab === 'products' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <Package className="w-5 h-5 mr-3" />
                Products
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('customers')}
                className={`flex items-center w-full px-4 py-3 text-left ${activeTab === 'customers' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <Users className="w-5 h-5 mr-3" />
                Customers
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex items-center w-full px-4 py-3 text-left ${activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <Settings className="w-5 h-5 mr-3" />
                Settings
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="absolute bottom-0 w-64 p-4 border-t">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex justify-between items-center px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'orders' && 'Orders Management'}
              {activeTab === 'products' && 'Products Management'}
              {activeTab === 'customers' && 'Customer Management'}
              {activeTab === 'settings' && 'System Settings'}
            </h2>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border rounded-lg w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
              
              {/* Notifications */}
              <div className="relative">
                <button 
                  className="relative p-2 rounded-full hover:bg-gray-100"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <AlertTriangle className="w-5 h-5 text-gray-600" />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-10 border">
                    <div className="p-3 border-b">
                      <h3 className="font-medium">Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-center text-gray-500">No notifications</p>
                      ) : (
                        <ul className="divide-y">
                          {notifications.map(notification => (
                            <li key={notification.id} className="p-3 hover:bg-gray-50">
                              <div className={`flex items-start ${notification.type === 'warning' ? 'text-orange-600' : notification.type === 'alert' ? 'text-red-600' : 'text-blue-600'}`}>
                                {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />}
                                {notification.type === 'alert' && <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
                                {notification.type === 'info' && <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
                                <span className="text-sm">{notification.message}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="p-2 border-t text-center">
                      <button className="text-sm text-blue-600 hover:text-blue-800">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* User menu */}
              <div className="relative">
                <button className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.role}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        </header>
        
        {/* Dashboard Content */}
        <main className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div>
                  {/* Date Range Filter */}
                  <div className="mb-6 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="border rounded-lg px-3 py-2"
                      >
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="last7days">Last 7 Days</option>
                        <option value="last30days">Last 30 Days</option>
                        <option value="thisMonth">This Month</option>
                        <option value="lastMonth">Last Month</option>
                      </select>
                    </div>
                    
                    <button 
                      className="flex items-center text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        setIsLoading(true);
                        setTimeout(() => setIsLoading(false), 800);
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Refresh Data
                    </button>
                  </div>
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                          <h3 className="text-2xl font-bold">{stats.totalOrders}</h3>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <ShoppingCart className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-sm">
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-green-500 font-medium">+12.5%</span>
                        <span className="text-gray-500 ml-1">from last period</span>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                          <h3 className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</h3>
                        </div>
                        <div className="p-2 bg-green-100 rounded-lg">
                          <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-sm">
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-green-500 font-medium">+8.2%</span>
                        <span className="text-gray-500 ml-1">from last period</span>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Total Customers</p>
                          <h3 className="text-2xl font-bold">{stats.totalCustomers}</h3>
                        </div>
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Users className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-sm">
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-green-500 font-medium">+5.3%</span>
                        <span className="text-gray-500 ml-1">from last period</span>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Total Products</p>
                          <h3 className="text-2xl font-bold">{stats.totalProducts}</h3>
                        </div>
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Package className="w-6 h-6 text-yellow-600" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-sm">
                        <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                        <span className="text-red-500 font-medium">-2.1%</span>
                        <span className="text-gray-500 ml-1">from last period</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Alert Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertTriangle className="w-6 h-6 text-orange-500 mr-3" />
                        <div>
                          <h3 className="font-medium text-orange-800">Low Stock Alert</h3>
                          <p className="text-orange-700">{stats.lowStockItems} products are below the minimum stock threshold</p>
                        </div>
                      </div>
                      <div className="mt-2 ml-9">
                        <button className="text-sm text-orange-800 hover:text-orange-900 underline">
                          View Items
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                      <div className="flex items-center">
                        <Clock className="w-6 h-6 text-blue-500 mr-3" />
                        <div>
                          <h3 className="font-medium text-blue-800">Pending Orders</h3>
                          <p className="text-blue-700">{stats.pendingOrders} orders require your attention</p>
                        </div>
                      </div>
                      <div className="mt-2 ml-9">
                        <button className="text-sm text-blue-800 hover:text-blue-900 underline">
                          Process Orders
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Recent Orders and Top Products */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow">
                      <div className="p-4 border-b flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800">Recent Orders</h3>
                        <Link to="/orders" className="text-sm text-blue-600 hover:text-blue-800">
                          View All
                        </Link>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Order ID
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Customer
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {recentOrders.map(order => (
                              <tr key={order.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                                  {order.id}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {order.customerName}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(order.date)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {formatCurrency(order.amount)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                                    {formatStatus(order.status)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow">
                      <div className="p-4 border-b flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800">Top Selling Products</h3>
                        <Link to="/products" className="text-sm text-blue-600 hover:text-blue-800">
                          View All
                        </Link>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Price
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sales
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stock
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {topProducts.map(product => (
                              <tr key={product.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-md"></div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                      <div className="text-sm text-gray-500">{product.id}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {formatCurrency(product.price)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {product.sales} units
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.stock < 20 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                      {product.stock} in stock
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'orders' && (
                <div>
                  <div className="bg-white rounded-lg shadow mb-6">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold text-gray-800">Orders Management</h3>
                      <p className="text-sm text-gray-600 mt-1">View and manage all customer orders</p>
                    </div>
                    <div className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Filter className="w-5 h-5 text-gray-500" />
                          <select className="border rounded-lg px-3 py-2">
                            <option value="all">All Orders</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="on-the-way">On the Way</option>
                            <option value="delivered">Delivered</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-5 h-5 text-gray-500" />
                          <select className="border rounded-lg px-3 py-2">
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="last7days">Last 7 Days</option>
                            <option value="last30days">Last 30 Days</option>
                            <option value="thisMonth">This Month</option>
                          </select>
                        </div>
                        
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search orders..."
                            className="pl-10 pr-4 py-2 border rounded-lg w-64"
                          />
                          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Order ID
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Customer
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {recentOrders.map(order => (
                              <tr key={order.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                                  {order.id}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {order.customerName}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(order.date)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {formatCurrency(order.amount)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                                    {formatStatus(order.status)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  <div className="flex space-x-2">
                                    <button className="text-blue-600 hover:text-blue-800">
                                      View
                                    </button>
                                    <button className="text-green-600 hover:text-green-800">
                                      Update
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4 px-4 py-2">
                        <div className="text-sm text-gray-500">
                          Showing 1 to 5 of 100 entries
                        </div>
                        <div className="flex space-x-1">
                          <button className="px-3 py-1 border rounded text-sm">Previous</button>
                          <button className="px-3 py-1 border rounded bg-blue-600 text-white text-sm">1</button>
                          <button className="px-3 py-1 border rounded text-sm">2</button>
                          <button className="px-3 py-1 border rounded text-sm">3</button>
                          <button className="px-3 py-1 border rounded text-sm">Next</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'products' && (
                <div>
                  <div className="bg-white rounded-lg shadow mb-6">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold text-gray-800">Products Management</h3>
                      <p className="text-sm text-gray-600 mt-1">View and manage your product inventory</p>
                    </div>
                    <div className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Filter className="w-5 h-5 text-gray-500" />
                          <select className="border rounded-lg px-3 py-2">
                            <option value="all">All Categories</option>
                            {availableCategories.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Filter className="w-5 h-5 text-gray-500" />
                          <select className="border rounded-lg px-3 py-2">
                            <option value="all">All Stock Status</option>
                            <option value="in-stock">In Stock</option>
                            <option value="low-stock">Low Stock</option>
                            <option value="out-of-stock">Out of Stock</option>
                          </select>
                        </div>
                        
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search products..."
                            className="pl-10 pr-4 py-2 border rounded-lg w-64"
                          />
                          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        </div>
                        
                        <button 
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
                          onClick={openAddProductModal}
                        >
                          <Plus className="w-5 h-5 mr-1" />
                          Add Product
                        </button>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Price
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stock
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {products.map(product => (
                              <tr key={product.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-md overflow-hidden">
                                      <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                      <div className="text-sm text-gray-500">ID: {product.id}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {product.categories.join(', ')}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {formatCurrency(product.price)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {product.quantity}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.quantity > 20 ? 'bg-green-100 text-green-800' : product.quantity > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                    {product.quantity > 20 ? 'In Stock' : product.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  <div className="flex space-x-2">
                                    <button 
                                      className="text-blue-600 hover:text-blue-800"
                                      onClick={() => handleEditProduct(product.id)}
                                    >
                                      Edit
                                    </button>
                                    <button 
                                      className="text-red-600 hover:text-red-800"
                                      onClick={() => handleDeleteProduct(product.id)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4 px-4 py-2">
                        <div className="text-sm text-gray-500">
                          Showing 1 to {products.length} of {products.length} entries
                        </div>
                        <div className="flex space-x-1">
                          <button className="px-3 py-1 border rounded text-sm">Previous</button>
                          <button className="px-3 py-1 border rounded bg-blue-600 text-white text-sm">1</button>
                          <button className="px-3 py-1 border rounded text-sm">2</button>
                          <button className="px-3 py-1 border rounded text-sm">3</button>
                          <button className="px-3 py-1 border rounded text-sm">Next</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'customers' && (
                <div>
                  <div className="bg-white rounded-lg shadow mb-6">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold text-gray-800">Customer Management</h3>
                      <p className="text-sm text-gray-600 mt-1">View and manage your customer database</p>
                    </div>
                    <div className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Filter className="w-5 h-5 text-gray-500" />
                          <select className="border rounded-lg px-3 py-2">
                            <option value="all">All Customers</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="new">New (Last 30 days)</option>
                          </select>
                        </div>
                        
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search customers..."
                            className="pl-10 pr-4 py-2 border rounded-lg w-64"
                          />
                          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        </div>
                        
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center">
                          <Plus className="w-5 h-5 mr-1" />
                          Add Customer
                        </button>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Customer
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Phone
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Orders
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Spent
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {[
                              { id: 'CUST-001', name: 'John Smith', email: 'john.smith@example.com', phone: '+66 123 456 789', orders: 12, spent: 15600 },
                              { id: 'CUST-002', name: 'Sarah Johnson', email: 'sarah.j@example.com', phone: '+66 234 567 890', orders: 8, spent: 9200 },
                              { id: 'CUST-003', name: 'Michael Brown', email: 'michael.b@example.com', phone: '+66 345 678 901', orders: 5, spent: 7500 },
                              { id: 'CUST-004', name: 'Emma Wilson', email: 'emma.w@example.com', phone: '+66 456 789 012', orders: 3, spent: 4200 },
                              { id: 'CUST-005', name: 'James Taylor', email: 'james.t@example.com', phone: '+66 567 890 123', orders: 1, spent: 1890 }
                            ].map(customer => (
                              <tr key={customer.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                      {customer.name.charAt(0)}
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                      <div className="text-sm text-gray-500">{customer.id}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {customer.email}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {customer.phone}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {customer.orders}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {formatCurrency(customer.spent)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  <div className="flex space-x-2">
                                    <button className="text-blue-600 hover:text-blue-800">
                                      View
                                    </button>
                                    <button className="text-green-600 hover:text-green-800">
                                      Edit
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4 px-4 py-2">
                        <div className="text-sm text-gray-500">
                          Showing 1 to 5 of 856 entries
                        </div>
                        <div className="flex space-x-1">
                          <button className="px-3 py-1 border rounded text-sm">Previous</button>
                          <button className="px-3 py-1 border rounded bg-blue-600 text-white text-sm">1</button>
                          <button className="px-3 py-1 border rounded text-sm">2</button>
                          <button className="px-3 py-1 border rounded text-sm">3</button>
                          <button className="px-3 py-1 border rounded text-sm">Next</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'settings' && (
                <div>
                  <div className="bg-white rounded-lg shadow mb-6">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold text-gray-800">System Settings</h3>
                      <p className="text-sm text-gray-600 mt-1">Configure your e-commerce platform settings</p>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-lg mb-2">Store Information</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Store Name
                              </label>
                              <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-lg"
                                defaultValue="My E-Commerce Store"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Store Email
                              </label>
                              <input
                                type="email"
                                className="w-full px-3 py-2 border rounded-lg"
                                defaultValue="contact@mystore.com"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Store Phone
                              </label>
                              <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-lg"
                                defaultValue="+66 123 456 789"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Store Address
                              </label>
                              <textarea
                                className="w-full px-3 py-2 border rounded-lg"
                                rows={3}
                                defaultValue="123 Main Street, Bangkok, Thailand"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-lg mb-2">Payment Settings</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Currency
                              </label>
                              <select className="w-full px-3 py-2 border rounded-lg">
                                <option value="THB">Thai Baht (THB)</option>
                                <option value="USD">US Dollar (USD)</option>
                                <option value="EUR">Euro (EUR)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Methods
                              </label>
                              <div className="space-y-2">
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id="payment-cash"
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    defaultChecked
                                  />
                                  <label htmlFor="payment-cash" className="ml-2 text-sm text-gray-700">
                                    Cash on Delivery
                                  </label>
                                </div>
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id="payment-bank"
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    defaultChecked
                                  />
                                  <label htmlFor="payment-bank" className="ml-2 text-sm text-gray-700">
                                    Bank Transfer
                                  </label>
                                </div>
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id="payment-credit"
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    defaultChecked
                                  />
                                  <label htmlFor="payment-credit" className="ml-2 text-sm text-gray-700">
                                    Credit/Debit Card
                                  </label>
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tax Rate (%)
                              </label>
                              <input
                                type="number"
                                className="w-full px-3 py-2 border rounded-lg"
                                defaultValue="7"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-lg mb-2">User Management</h4>
                          <div className="space-y-3">
                            <button
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
                              onClick={() => setShowAddUserModal(true)}
                            >
                              <Plus className="w-5 h-5 mr-1" />
                              Add New User
                            </button>
                        
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Name
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Role
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                        {user.name}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                        {user.role}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex space-x-2">
                                          <button 
                                            className="text-blue-600 hover:text-blue-800"
                                            onClick={() => handleEditUser(user.id)}
                                          >
                                            Edit
                                          </button>
                                          <button 
                                            className="text-red-600 hover:text-red-800"
                                            onClick={() => handleDeleteUser(user.id)}
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-lg mb-2">Notification Settings</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Notifications
                              </label>
                              <div className="space-y-2">
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id="notify-new-order"
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    defaultChecked
                                  />
                                  <label htmlFor="notify-new-order" className="ml-2 text-sm text-gray-700">
                                    New Order
                                  </label>
                                </div>
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id="notify-low-stock"
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    defaultChecked
                                  />
                                  <label htmlFor="notify-low-stock" className="ml-2 text-sm text-gray-700">
                                    Low Stock Alert
                                  </label>
                                </div>
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id="notify-customer-message"
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    defaultChecked
                                  />
                                  <label htmlFor="notify-customer-message" className="ml-2 text-sm text-gray-700">
                                    Customer Message
                                  </label>
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Low Stock Threshold
                              </label>
                              <input
                                type="number"
                                className="w-full px-3 py-2 border rounded-lg"
                                defaultValue="10"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-end">
                        <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg mr-2">
                          Cancel
                        </button>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      
      {/* Add Product Modal */}
      {showAddProductModal && (
        <Modal onClose={() => setShowAddProductModal(false)}>
          <div className="max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
            
            <div className="space-y-4">
              {/* Basic Information */}
              <div>
                <h3 className="text-md font-medium mb-2 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-500" />
                  Basic Information
                </h3>
                <div className="space-y-3">
                  <Input
                    label="Product Name"
                    name="name"
                    value={productForm.name}
                    onChange={handleInputChange}
                    error={formErrors.name}
                    fullWidth
                    required
                  />
                  
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={productForm.description}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none transition-all duration-250 ${formErrors.description ? 'border-red-500' : 'border-gray-300 focus:border-[#FFD700]'}`}
                      rows={4}
                      required
                    />
                    {formErrors.description && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Categories */}
              <div>
                <h3 className="text-md font-medium mb-2 flex items-center">
                  <Tag className="w-5 h-5 mr-2 text-blue-500" />
                  Categories
                </h3>
                <div className="space-y-3">
                  <div className="flex items-end space-x-2">
                    <div className="flex-grow">
                      <label className="block mb-2 font-medium text-gray-700">
                        Select Category
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-white border rounded-lg focus:outline-none transition-all duration-250 border-gray-300 focus:border-[#FFD700]"
                      >
                        <option value="">Select a category</option>
                        {availableCategories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleAddCategory}
                    >
                      Add
                    </Button>
                  </div>
                  
                  {formErrors.categories && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.categories}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {productForm.categories.map(category => (
                      <div key={category} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
                        <span>{category}</span>
                        <button
                          type="button"
                          className="ml-2 text-blue-600 hover:text-blue-800"
                          onClick={() => handleRemoveCategory(category)}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Pricing and Inventory */}
              <div>
                <h3 className="text-md font-medium mb-2 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-blue-500" />
                  Pricing and Inventory
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Price (THB)"
                    name="price"
                    type="number"
                    value={productForm.price.toString()}
                    onChange={handleInputChange}
                    error={formErrors.price}
                    fullWidth
                    required
                    min="0"
                    step="0.01"
                  />
                  
                  <Input
                    label="Deposit (THB)"
                    name="deposit"
                    type="number"
                    value={productForm.deposit.toString()}
                    onChange={handleInputChange}
                    error={formErrors.deposit}
                    fullWidth
                    min="0"
                    step="0.01"
                  />
                  
                  <Input
                    label="Quantity in Stock"
                    name="quantity"
                    type="number"
                    value={productForm.quantity.toString()}
                    onChange={handleInputChange}
                    error={formErrors.quantity}
                    fullWidth
                    required
                    min="0"
                  />
                </div>
              </div>
              
              {/* Image */}
              <div>
                <h3 className="text-md font-medium mb-2 flex items-center">
                  <Image className="w-5 h-5 mr-2 text-blue-500" />
                  Product Image
                </h3>
                <Input
                  label="Image URL"
                  name="imageUrl"
                  value={productForm.imageUrl}
                  onChange={handleInputChange}
                  error={formErrors.imageUrl}
                  fullWidth
                  required
                  placeholder="https://example.com/image.jpg"
                />
                
                {productForm.imageUrl && !formErrors.imageUrl && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-1">Preview:</p>
                    <div className="w-32 h-32 border rounded-lg overflow-hidden">
                      <img
                        src={productForm.imageUrl}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/150?text=Image+Error';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Technical Specifications */}
              <div>
                <h3 className="text-md font-medium mb-2 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-blue-500" />
                  Technical Specifications
                </h3>
                <div className="space-y-3">
                  <Input
                    label="Voltage (optional)"
                    name="voltage"
                    value={productForm.voltage || ''}
                    onChange={handleInputChange}
                    fullWidth
                    placeholder="e.g. 220V"
                  />
                  
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Additional Specifications
                    </label>
                    <div className="flex items-end space-x-2 mb-2">
                      <div className="flex-grow">
                        <input
                          type="text"
                          placeholder="Specification name"
                          value={newSpecKey}
                          onChange={(e) => setNewSpecKey(e.target.value)}
                          className="w-full px-4 py-3 bg-white border rounded-lg focus:outline-none transition-all duration-250 border-gray-300 focus:border-[#FFD700]"
                        />
                      </div>
                      <div className="flex-grow">
                        <input
                          type="text"
                          placeholder="Specification value"
                          value={newSpecValue}
                          onChange={(e) => setNewSpecValue(e.target.value)}
                          className="w-full px-4 py-3 bg-white border rounded-lg focus:outline-none transition-all duration-250 border-gray-300 focus:border-[#FFD700]"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleAddSpecification}
                      >
                        Add
                      </Button>
                    </div>
                    
                    {Object.keys(productForm.specifications).length > 0 && (
                      <div className="mt-3 border rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Specification
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Value
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(productForm.specifications).map(([key, value]) => (
                              <tr key={key} className="hover:bg-gray-50">
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                  {key}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                  {value}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                  <button
                                    type="button"
                                    className="text-red-600 hover:text-red-800"
                                    onClick={() => handleRemoveSpecification(key)}
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Form Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddProductModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSubmitProduct}
                  className="flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Product
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add New User Modal */}
      {showAddUserModal && (
        <Modal onClose={() => setShowAddUserModal(false)}>
          <div>
            <h2 className="text-xl font-semibold mb-4">Add New User</h2>
            <div className="space-y-4">
              <Input
                label="Name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                fullWidth
              />
              <Input
                label="Role"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                fullWidth
              />
              <Input
                label="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                fullWidth
              />
              <Input
                label="Password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                fullWidth
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="secondary" onClick={() => setShowAddUserModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAddUser}>
                Add User
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BackOfficePage;
