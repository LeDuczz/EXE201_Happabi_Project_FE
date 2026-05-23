import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOtp from './pages/auth/VerifyOtp';
import SocialCallback from './pages/auth/SocialCallback';
import ForgotPassword from './pages/auth/ForgotPassword';
import MainLayout from './components/layout/MainLayout';
import Wallet from './pages/nurse/Wallet';
import GmvDashboard from './pages/admin/GmvDashboard';
import Search from './pages/mother/Search';
import Compare from './pages/mother/Compare';
import Bookings from './pages/shared/Bookings';
import Checklist from './pages/nurse/Checklist';
import NurseManager from './pages/admin/NurseManager';
import UserManager from './pages/admin/UserManager';
import BookingManager from './pages/admin/BookingManager';

const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#f7f0ff]">
    <Loader2 size={36} className="animate-spin text-lav-dark" />
  </div>
);

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/auth/mother" replace />;

  return <>{children}</>;
};

const GuestRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading, primaryRole } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to={primaryRole === 'NURSE' ? '/home' : '/'} replace />;

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />

    <Route path="/auth/mother" element={<GuestRoute><Login portalRole="MOTHER" /></GuestRoute>} />
    <Route path="/auth/nurse" element={<GuestRoute><Login portalRole="NURSE" /></GuestRoute>} />
    <Route path="/login" element={<Navigate to="/auth/mother" replace />} />
    <Route path="/register/mother" element={<GuestRoute><Register role="MOTHER" /></GuestRoute>} />
    <Route path="/register/nurse" element={<GuestRoute><Register role="NURSE" /></GuestRoute>} />
    <Route path="/register" element={<Navigate to="/register/mother" replace />} />
    <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
    <Route path="/verify-otp" element={<GuestRoute><VerifyOtp /></GuestRoute>} />
    <Route path="/social/callback" element={<SocialCallback />} />

    <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
      <Route path="/home" element={<Home />} />
      <Route path="/search" element={<Search />} />
      <Route path="/compare" element={<Compare />} />
      <Route path="/bookings" element={<Bookings />} />
      <Route path="/checklist" element={<Checklist />} />
      <Route path="/chat" element={<div className="text-xl font-bold text-lav-dark">Trang chat đang phát triển</div>} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/wallet" element={<Wallet />} />
      <Route path="/admin/gmv" element={<GmvDashboard />} />
      <Route path="/admin/nurses" element={<NurseManager />} />
      <Route path="/admin/users" element={<UserManager />} />
      <Route path="/admin/bookings" element={<BookingManager />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
