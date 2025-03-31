import { Routes, Route } from 'react-router-dom';
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
import ProtectedRoute from './components/ProtectedRoute';
import DevelopersPage from './pages/DevelopersPage';
import CategoriesPage from './pages/CategoriesPage';
import ChatBot from './components/ChatBot';
import PageTransition from './components/PageTransition';

function App() {
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
          <Route path="/track-order" element={<TrackOrderPage />} />
          <Route path="/driver-tracking" element={<DriverTrackingPage />} />
          <Route path="/staff-tracking" element={<StaffTrackingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/staff-login" element={<StaffLoginPage />} />
          <Route path="/staff-dashboard" element={<StaffDashboardPage />} />
          <Route path="/developers" element={<DevelopersPage />} />
          <Route path="/tools" element={<CategoriesPage />} />
        </Routes>
      </PageTransition>
      <ChatBot />
    </>
  );
}

export default App;
