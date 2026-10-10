import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"
import { NotificationProvider } from "./context/NotificationContext"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { OrderProvider } from "./context/OrderContext"
import { QueryProvider } from "./context/QueryProvider"
import PropTypes from 'prop-types'
import Login from "./pages/login/login"
import RegisterPage from "./pages/register/register"
import LandingPage from "./pages/landing/landing"
import AboutPage from "./pages/about/about"
import ServicesPage from "./pages/services/services"
import SubscriptionPage from "./pages/subscription/subs"
import HomePage from "./pages/home/home"
import ChatPage from "./pages/chat/chat"
import ProviderDashboard from "./pages/dashboard/dashboard"
import ProviderProfile from "./pages/profile/provider-profile"
import StudentProfile from "./pages/profile/student-profile"
import ProviderSettings from "./pages/settings/provider-settings"
import StudentSettings from "./pages/settings/student-settings"
import AdminDashboard from "./pages/admin/admin"
import ProviderWallet from "./pages/wallet/provider-wallet"
import ForgotPasswordPage from "./pages/auth/forgot-password"
import ResetPasswordPage from "./pages/auth/reset-password"
import HelpPage from "./pages/help/help"
import PrivacyPage from "./pages/legal/privacy"
import TermsPage from "./pages/legal/terms"
import NotFoundPage from "./pages/legal/not-found"
import Splash from "./components/splash/Splash"
// مكون للتحقق من صفحة landing - إذا كان المستخدم مسجل دخول يتم توجيهه للصفحة المناسبة
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    // إذا كان مزود خدمة، يتم توجيهه للداشبورد
    if (user?.role === 'provider') {
      return <Navigate to="/dashboard" replace />;
    }
    // إذا كان أدمن، يتم توجيهه للوحة المسؤول
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    // إذا كان طالب، يتم توجيهه للصفحة الرئيسية
    return <Navigate to="/home" replace />;
  }
  return children;
};
PublicRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
// مكون للتحقق من الصفحات المحمية - إذا لم يكن مسجل دخول يتم توجيهه لصفحة landing
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
// مكون للتحقق من صفحات الأدمن - فقط للأدمن
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (user?.role !== 'admin') {
    return <Navigate to="/home" replace />;
  }
  return children;
};
AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
// مكون للتحقق من الصفحات المحمية للأدمن - يسمح للأدمن بالوصول إلى جميع الصفحات
const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  // الأدمن يمكنه الوصول إلى جميع الصفحات
  if (user?.role === 'admin') {
    return children;
  }
  // مزود الخدمة يمكنه الوصول إلى الصفحات الخاصة به
  if (user?.role === 'provider') {
    return children;
  }
  // الطالب يمكنه الوصول إلى الصفحات الخاصة به
  return children;
};

AdminProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
// مكون لتوجيه المستخدم إلى صفحة الملف الشخصي المناسبة بناءً على دوره
const ProfileRoute = () => {
  const { user } = useAuth();
  if (user?.role === 'provider') {
    return <ProviderProfile />;
  }
  // الأدمن والطالب يرى صفحة الطالب
  return <StudentProfile />;
};
// مكون لتوجيه المستخدم إلى صفحة الإعدادات المناسبة بناءً على دوره
const SettingsRoute = () => {
  const { user } = useAuth();
  if (user?.role === 'provider') {
    return <ProviderSettings />;
  }
  // الأدمن والطالب يرى إعدادات الطالب
  return <StudentSettings />;
};
function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <Splash />
        <NotificationProvider>
          <OrderProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path='/' element={
                  <PublicRoute>
                    <LandingPage />
                  </PublicRoute>
                } />
                <Route path="/home" element={
                  <AdminProtectedRoute>
                    <HomePage />
                  </AdminProtectedRoute>
                } />
                <Route path="/chat" element={
                  <AdminProtectedRoute>
                    <ChatPage />
                  </AdminProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <AdminProtectedRoute>
                    <ProviderDashboard />
                  </AdminProtectedRoute>
                } />
                <Route path="/profile" element={
                  <AdminProtectedRoute>
                    <ProfileRoute />
                  </AdminProtectedRoute>
                } />
                <Route path="/settings" element={
                  <AdminProtectedRoute>
                    <SettingsRoute />
                  </AdminProtectedRoute>
                } />
                <Route path="/wallet" element={
                  <AdminProtectedRoute>
                    <ProviderWallet />
                  </AdminProtectedRoute>
                } />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="*" element={<NotFoundPage />} />
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />
                <Route path="/price" element={<SubscriptionPage />} />
              </Routes>
            </BrowserRouter>
          </OrderProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
export default App
