import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import BasketPage from './pages/BasketPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import TrackOrderPage from './pages/TrackOrderPage';
import DriverTrackingPage from './pages/DriverTrackingPage';
import StaffTrackingPage from './pages/StaffTrackingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import StaffLoginPage from './pages/StaffLoginPage';
import StaffDashboardPage from './pages/StaffDashboardPage';
import BackOfficePage from './pages/BackOfficePage';
import ProtectedRoute from './components/ProtectedRoute';
import DevelopersPage from './pages/DevelopersPage';
import CategoriesPage from './pages/CategoriesPage';
import ChatBot from './components/ChatBot';
import PageTransition from './components/PageTransition';
import { useAuth } from './context/AuthContext';

function App() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <>
      <Navbar />
      <PageTransition>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/basket" element={<BasketPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          } />
          <Route path="/track-order" element={
            isAdmin ? <TrackOrderPage /> : <Navigate to="/" />
          } />
          <Route path="/driver-tracking" element={
            isAdmin ? <DriverTrackingPage /> : <Navigate to="/" />
          } />
          <Route path="/staff-tracking" element={<StaffTrackingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/staff-login" element={<StaffLoginPage />} />
          <Route path="/staff-dashboard" element={<StaffDashboardPage />} />
          <Route path="/back-office" element={
            user?.role === 'admin' ? <BackOfficePage /> : <Navigate to="/" />
          } />
          <Route path="/developers" element={<DevelopersPage />} />
          <Route path="/categories" element={
            <ProtectedRoute>
              <CategoriesPage />
            </ProtectedRoute>
          } />
        </Routes>
      </PageTransition>
      <ChatBot />
    </>
  );
}

export default App;
