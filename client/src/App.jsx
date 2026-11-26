import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/common/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import OtpLogin from './pages/OtpLogin';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ServicesPage from './pages/ServicesPage';
import Booking from './pages/Booking';
import Profile from './pages/Profile';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';
import './App.css';

const AdminLayout = lazy(() => import('./features/admin/AdminLayout'));
const DashboardHome = lazy(() => import('./features/admin/pages/DashboardHome'));
const ManageBookings = lazy(() => import('./features/admin/pages/ManageBookings'));
const ManageServices = lazy(() => import('./features/admin/pages/ManageServices'));
const ManageUsers = lazy(() => import('./features/admin/pages/ManageUsers'));
const TechnicianDashboard = lazy(() => import('./features/technician/TechnicianDashboard'));
const Tracking = lazy(() => import('./pages/Tracking'));

const RouteFallback = () => (
  <div className="page-loader" role="status" aria-live="polite">
    Loading...
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#1e293b',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              padding: '12px 20px',
              fontSize: '0.9rem'
            }
          }}
        />
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Admin Routes - No Navbar/Footer */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<DashboardHome />} />
            <Route path="bookings" element={<ManageBookings />} />
            <Route path="services" element={<ManageServices />} />
            <Route path="users" element={<ManageUsers />} />
          </Route>

          {/* Technician Route - Isolated Dashboard */}
          <Route path="/technician" element={<ProtectedRoute><TechnicianDashboard /></ProtectedRoute>} />

          {/* Public Routes - With Navbar/Footer */}
          <Route path="*" element={
            <>
              <Navbar />
              <Suspense fallback={<RouteFallback />}>
        <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/otp-login" element={<OtpLogin />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/booking" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/tracking/:bookingId" element={<ProtectedRoute><Tracking /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Footer />
            </>
          } />
        </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
