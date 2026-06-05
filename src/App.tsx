import { useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import axiosClient from './api/axiosClient';
import { AuthProvider, useAuth, type UserRole } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import Profile from './pages/Profile';
import NurseOnboarding from './pages/NurseOnboarding';
import DoctorNurseReview from './pages/DoctorNurseReview';
import DoctorNurseReviewDetail from './pages/DoctorNurseReviewDetail';
import DoctorProfile from './pages/doctor/Profile';
import ChatPage from './pages/ChatPage';
import NurseBookings from './pages/nurse/Bookings';
import NurseChecklist from './pages/nurse/Checklist';
import NurseProfile from './pages/nurse/Profile';
import NurseRevenue from './pages/nurse/Revenue';
import MotherNursePublicProfile from './pages/mother/NursePublicProfile';
import MotherNurseSearch from './pages/mother/NurseSearch';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUserManagement from './pages/admin/UserManagement';
import AdminSystemConfig from './pages/admin/SystemConfig';
import AdminAuditLogs from './pages/admin/AuditLogs';
import AdminDoctorAccounts from './pages/admin/DoctorAccounts';
import AdminProfile from './pages/admin/Profile';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOtp from './pages/auth/VerifyOtp';
import SocialCallback from './pages/auth/SocialCallback';
import ForgotPassword from './pages/auth/ForgotPassword';
import MainLayout from './components/layout/MainLayout';

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

const roleHomePath = (role: UserRole | null) => {
  if (role === 'NURSE') return '/nurse/onboarding';
  if (role === 'DOCTOR') return '/doctor/nurses/review';
  if (role === 'ADMIN') return '/admin/dashboard';
  return '/';
};

const roleDashboardPath = (role: UserRole | null) => {
  if (role === 'NURSE') return '/nurse/home';
  if (role === 'DOCTOR') return '/doctor/nurses/review';
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'MOTHER') return '/mother/home';
  return '/';
};

const RoleRoute = ({ allowedRoles, children }: { allowedRoles: UserRole[]; children: ReactNode }) => {
  const { primaryRole, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!primaryRole || !allowedRoles.includes(primaryRole)) {
    return <Navigate to={roleHomePath(primaryRole)} replace />;
  }

  return <>{children}</>;
};

const RoleRedirect = ({ paths }: { paths?: Partial<Record<UserRole, string>> }) => {
  const { primaryRole, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  const target = primaryRole && paths?.[primaryRole]
    ? paths[primaryRole]
    : roleDashboardPath(primaryRole);

  return <Navigate to={target ?? '/'} replace />;
};

const GuestRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading, primaryRole } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) {
    return <Navigate to={roleHomePath(primaryRole)} replace />;
  }

  return <>{children}</>;
};

const NurseActiveRoute = ({ children }: { children: ReactNode }) => {
  const { primaryRole } = useAuth();
  const [status, setStatus] = useState<'loading' | 'active' | 'blocked'>('loading');

  useEffect(() => {
    if (primaryRole !== 'NURSE') {
      setStatus('active');
      return;
    }

    axiosClient.get('/api/v1/nurses/me/onboarding')
      .then((response) => {
        const nurseStatus = response.data?.data?.nurseStatus;
        console.log('Nurse Status Check:', nurseStatus);
        setStatus(nurseStatus === 'ACTIVE' ? 'active' : 'blocked');
      })
      .catch((err) => {
        console.error('Nurse Status Check Error:', err);
        setStatus('blocked');
      });
  }, [primaryRole]);

  if (status === 'loading') return <LoadingScreen />;
  if (status === 'blocked') return <Navigate to="/nurse/onboarding" replace />;
  return <>{children}</>;
};

const NurseOnboardingRoute = ({ children }: { children: ReactNode }) => {
  const { primaryRole } = useAuth();
  const [status, setStatus] = useState<'loading' | 'active' | 'editable'>('loading');

  useEffect(() => {
    if (primaryRole !== 'NURSE') {
      setStatus('editable');
      return;
    }

    let ignore = false;
    axiosClient.get('/api/v1/nurses/me/onboarding')
      .then((response) => {
        if (ignore) return;
        const nurseStatus = response.data?.data?.nurseStatus;
        setStatus(nurseStatus === 'ACTIVE' ? 'active' : 'editable');
      })
      .catch(() => {
        if (!ignore) setStatus('editable');
      });

    return () => {
      ignore = true;
    };
  }, [primaryRole]);

  if (status === 'loading') return <LoadingScreen />;
  if (status === 'active') return <Navigate to="/nurse/home" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />

    <Route path="/auth/mother" element={<GuestRoute><Login portalRole="MOTHER" /></GuestRoute>} />
    <Route path="/auth/nurse" element={<GuestRoute><Login portalRole="NURSE" /></GuestRoute>} />
    <Route path="/auth/doctor" element={<GuestRoute><Login portalRole="DOCTOR" /></GuestRoute>} />
    <Route path="/auth/admin" element={<GuestRoute><Login portalRole="ADMIN" /></GuestRoute>} />
    <Route path="/login" element={<Navigate to="/auth/mother" replace />} />
    <Route path="/register/mother" element={<GuestRoute><Register role="MOTHER" /></GuestRoute>} />
    <Route path="/register/nurse" element={<GuestRoute><Register role="NURSE" /></GuestRoute>} />
    <Route path="/register" element={<Navigate to="/register/mother" replace />} />
    <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
    <Route path="/verify-otp" element={<GuestRoute><VerifyOtp /></GuestRoute>} />
    <Route path="/social/callback" element={<SocialCallback />} />

    <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
      <Route path="/home" element={<RoleRedirect />} />
      <Route path="/search" element={<RoleRedirect paths={{ MOTHER: '/mother/search', NURSE: '/nurse/revenue' }} />} />
      <Route path="/compare" element={<RoleRedirect paths={{ MOTHER: '/mother/compare', NURSE: '/nurse/checklist' }} />} />
      <Route path="/bookings" element={<RoleRedirect paths={{ MOTHER: '/mother/bookings', NURSE: '/nurse/bookings' }} />} />
      <Route path="/chat" element={<RoleRedirect paths={{ MOTHER: '/mother/chat', NURSE: '/nurse/chat', DOCTOR: '/doctor/chat', ADMIN: '/admin/chat' }} />} />
      <Route path="/profile" element={<RoleRedirect paths={{ MOTHER: '/mother/profile', NURSE: '/nurse/profile', DOCTOR: '/doctor/profile', ADMIN: '/admin/profile' }} />} />

      <Route path="/mother/home" element={<RoleRoute allowedRoles={['MOTHER']}><Home /></RoleRoute>} />
      <Route path="/mother/search" element={<RoleRoute allowedRoles={['MOTHER']}><MotherNurseSearch /></RoleRoute>} />
      <Route path="/mother/nurses/:profileId" element={<RoleRoute allowedRoles={['MOTHER']}><MotherNursePublicProfile /></RoleRoute>} />
      <Route path="/mother/compare" element={<RoleRoute allowedRoles={['MOTHER']}><div className="text-xl font-bold text-lav-dark">Trang so sÃ¡nh / checklist Ä‘ang phÃ¡t triá»ƒn</div></RoleRoute>} />
      <Route path="/mother/bookings" element={<RoleRoute allowedRoles={['MOTHER']}><div className="text-xl font-bold text-lav-dark">Trang lá»‹ch háº¹n Ä‘ang phÃ¡t triá»ƒn</div></RoleRoute>} />
      <Route path="/mother/chat" element={<RoleRoute allowedRoles={['MOTHER']}><ChatPage /></RoleRoute>} />
      <Route path="/mother/profile" element={<RoleRoute allowedRoles={['MOTHER']}><Profile /></RoleRoute>} />

      <Route path="/nurse/home" element={<RoleRoute allowedRoles={['NURSE']}><NurseActiveRoute><Home /></NurseActiveRoute></RoleRoute>} />
      <Route path="/nurse/onboarding" element={<RoleRoute allowedRoles={['NURSE']}><NurseOnboardingRoute><NurseOnboarding /></NurseOnboardingRoute></RoleRoute>} />
      <Route path="/nurse/bookings" element={<RoleRoute allowedRoles={['NURSE']}><NurseActiveRoute><NurseBookings /></NurseActiveRoute></RoleRoute>} />
      <Route path="/nurse/checklist" element={<RoleRoute allowedRoles={['NURSE']}><NurseActiveRoute><NurseChecklist /></NurseActiveRoute></RoleRoute>} />
      <Route path="/nurse/revenue" element={<RoleRoute allowedRoles={['NURSE']}><NurseActiveRoute><NurseRevenue /></NurseActiveRoute></RoleRoute>} />
      <Route path="/nurse/chat" element={<RoleRoute allowedRoles={['NURSE']}><ChatPage /></RoleRoute>} />
      <Route path="/nurse/profile" element={<RoleRoute allowedRoles={['NURSE']}><NurseProfile /></RoleRoute>} />

      <Route path="/doctor/nurses/review" element={<RoleRoute allowedRoles={['DOCTOR']}><DoctorNurseReview /></RoleRoute>} />
      <Route path="/doctor/nurses/review/:profileId" element={<RoleRoute allowedRoles={['DOCTOR']}><DoctorNurseReviewDetail /></RoleRoute>} />
      <Route path="/doctor/chat" element={<RoleRoute allowedRoles={['DOCTOR']}><ChatPage /></RoleRoute>} />
      <Route path="/doctor/profile" element={<RoleRoute allowedRoles={['DOCTOR']}><DoctorProfile /></RoleRoute>} />

      <Route path="/admin/dashboard" element={<RoleRoute allowedRoles={['ADMIN']}><AdminDashboard /></RoleRoute>} />
      <Route path="/admin/doctors" element={<RoleRoute allowedRoles={['ADMIN']}><AdminDoctorAccounts /></RoleRoute>} />
      <Route path="/admin/users" element={<RoleRoute allowedRoles={['ADMIN']}><AdminUserManagement /></RoleRoute>} />
      <Route path="/admin/system-config" element={<RoleRoute allowedRoles={['ADMIN']}><AdminSystemConfig /></RoleRoute>} />
      <Route path="/admin/audit-logs" element={<RoleRoute allowedRoles={['ADMIN']}><AdminAuditLogs /></RoleRoute>} />
      <Route path="/admin/chat" element={<RoleRoute allowedRoles={['ADMIN']}><ChatPage /></RoleRoute>} />
      <Route path="/admin/profile" element={<RoleRoute allowedRoles={['ADMIN']}><AdminProfile /></RoleRoute>} />
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
