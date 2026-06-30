import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import axiosClient from './api/axiosClient';
import { AuthProvider, useAuth, type UserRole } from './contexts/AuthContext';
import MainLayout from './components/layout/MainLayout';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Home = lazy(() => import('./pages/Home'));
const Profile = lazy(() => import('./pages/Profile'));
const Feedback = lazy(() => import('./pages/Feedback'));
const NurseOnboarding = lazy(() => import('./pages/NurseOnboarding'));
const DoctorNurseReview = lazy(() => import('./pages/DoctorNurseReview'));
const DoctorNurseReviewDetail = lazy(() => import('./pages/DoctorNurseReviewDetail'));
const DoctorProfile = lazy(() => import('./pages/doctor/Profile'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const NurseBookings = lazy(() => import('./pages/nurse/Bookings'));
const NurseChecklist = lazy(() => import('./pages/nurse/Checklist'));
const NurseProfile = lazy(() => import('./pages/nurse/Profile'));
const NurseRevenue = lazy(() => import('./pages/nurse/Revenue'));
const MotherNursePublicProfile = lazy(() => import('./pages/mother/NursePublicProfile'));
const MotherNurseSearch = lazy(() => import('./pages/mother/NurseSearch'));
const MotherNurseCompare = lazy(() => import('./pages/mother/NurseCompare'));
const MotherBookings = lazy(() => import('./pages/mother/Bookings'));
const MotherCreateBooking = lazy(() => import('./pages/mother/CreateBooking'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminUserManagement = lazy(() => import('./pages/admin/UserManagement'));
const AdminSystemConfig = lazy(() => import('./pages/admin/SystemConfig'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const AdminDoctorAccounts = lazy(() => import('./pages/admin/DoctorAccounts'));
const AdminWallet = lazy(() => import('./pages/admin/Wallet'));
const AdminWorkSessionIncidents = lazy(() => import('./pages/admin/WorkSessionIncidents'));
const AdminFeedbacks = lazy(() => import('./pages/admin/Feedbacks'));
const AdminKnowledgeBase = lazy(() => import('./pages/admin/KnowledgeBase'));
const AdminProfile = lazy(() => import('./pages/admin/Profile'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const VerifyOtp = lazy(() => import('./pages/auth/VerifyOtp'));
const SocialCallback = lazy(() => import('./pages/auth/SocialCallback'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));

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
      <Route path="/feedback" element={<RoleRedirect paths={{ MOTHER: '/mother/feedback', NURSE: '/nurse/feedback', DOCTOR: '/doctor/feedback', ADMIN: '/admin/feedbacks' }} />} />
      <Route path="/profile" element={<RoleRedirect paths={{ MOTHER: '/mother/profile', NURSE: '/nurse/profile', DOCTOR: '/doctor/profile', ADMIN: '/admin/profile' }} />} />

      <Route path="/mother/home" element={<RoleRoute allowedRoles={['MOTHER']}><Home /></RoleRoute>} />
      <Route path="/mother/search" element={<RoleRoute allowedRoles={['MOTHER']}><MotherNurseSearch /></RoleRoute>} />
      <Route path="/mother/nurses/:profileId" element={<RoleRoute allowedRoles={['MOTHER']}><MotherNursePublicProfile /></RoleRoute>} />
      <Route path="/mother/compare" element={<RoleRoute allowedRoles={['MOTHER']}><MotherNurseCompare /></RoleRoute>} />
      <Route path="/mother/bookings" element={<RoleRoute allowedRoles={['MOTHER']}><MotherBookings /></RoleRoute>} />
      <Route path="/mother/bookings/new" element={<RoleRoute allowedRoles={['MOTHER']}><MotherCreateBooking /></RoleRoute>} />
      <Route path="/mother/chat" element={<RoleRoute allowedRoles={['MOTHER']}><ChatPage /></RoleRoute>} />
      <Route path="/mother/feedback" element={<RoleRoute allowedRoles={['MOTHER']}><Feedback /></RoleRoute>} />
      <Route path="/mother/profile" element={<RoleRoute allowedRoles={['MOTHER']}><Profile /></RoleRoute>} />

      <Route path="/nurse/home" element={<RoleRoute allowedRoles={['NURSE']}><NurseActiveRoute><Home /></NurseActiveRoute></RoleRoute>} />
      <Route path="/nurse/onboarding" element={<RoleRoute allowedRoles={['NURSE']}><NurseOnboardingRoute><NurseOnboarding /></NurseOnboardingRoute></RoleRoute>} />
      <Route path="/nurse/bookings" element={<RoleRoute allowedRoles={['NURSE']}><NurseActiveRoute><NurseBookings /></NurseActiveRoute></RoleRoute>} />
      <Route path="/nurse/checklist" element={<RoleRoute allowedRoles={['NURSE']}><NurseActiveRoute><NurseChecklist /></NurseActiveRoute></RoleRoute>} />
      <Route path="/nurse/work-sessions/:workSessionId" element={<RoleRoute allowedRoles={['NURSE']}><NurseActiveRoute><NurseChecklist /></NurseActiveRoute></RoleRoute>} />
      <Route path="/nurse/revenue" element={<RoleRoute allowedRoles={['NURSE']}><NurseActiveRoute><NurseRevenue /></NurseActiveRoute></RoleRoute>} />
      <Route path="/nurse/chat" element={<RoleRoute allowedRoles={['NURSE']}><ChatPage /></RoleRoute>} />
      <Route path="/nurse/feedback" element={<RoleRoute allowedRoles={['NURSE']}><NurseActiveRoute><Feedback /></NurseActiveRoute></RoleRoute>} />
      <Route path="/nurse/profile" element={<RoleRoute allowedRoles={['NURSE']}><NurseProfile /></RoleRoute>} />

      <Route path="/doctor/nurses/review" element={<RoleRoute allowedRoles={['DOCTOR']}><DoctorNurseReview /></RoleRoute>} />
      <Route path="/doctor/nurses/review/:profileId" element={<RoleRoute allowedRoles={['DOCTOR']}><DoctorNurseReviewDetail /></RoleRoute>} />
      <Route path="/doctor/chat" element={<RoleRoute allowedRoles={['DOCTOR']}><ChatPage /></RoleRoute>} />
      <Route path="/doctor/feedback" element={<RoleRoute allowedRoles={['DOCTOR']}><Feedback /></RoleRoute>} />
      <Route path="/doctor/profile" element={<RoleRoute allowedRoles={['DOCTOR']}><DoctorProfile /></RoleRoute>} />

      <Route path="/admin/dashboard" element={<RoleRoute allowedRoles={['ADMIN']}><AdminDashboard /></RoleRoute>} />
      <Route path="/admin/doctors" element={<RoleRoute allowedRoles={['ADMIN']}><AdminDoctorAccounts /></RoleRoute>} />
      <Route path="/admin/users" element={<RoleRoute allowedRoles={['ADMIN']}><AdminUserManagement /></RoleRoute>} />
      <Route path="/admin/wallet" element={<RoleRoute allowedRoles={['ADMIN']}><AdminWallet /></RoleRoute>} />
      <Route path="/admin/incidents" element={<RoleRoute allowedRoles={['ADMIN']}><AdminWorkSessionIncidents /></RoleRoute>} />
      <Route path="/admin/feedbacks" element={<RoleRoute allowedRoles={['ADMIN']}><AdminFeedbacks /></RoleRoute>} />
      <Route path="/admin/knowledge" element={<RoleRoute allowedRoles={['ADMIN']}><AdminKnowledgeBase /></RoleRoute>} />
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
      <Suspense fallback={<LoadingScreen />}>
        <AppRoutes />
      </Suspense>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
