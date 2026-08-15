import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminCategories from './pages/AdminCategories';
import AdminJewelryCategories from './pages/AdminJewelryCategories';
import AdminWatches from './pages/AdminWatches';
import AdminUsers from './pages/AdminUsers';
import AdminOrders from './pages/AdminOrders';
import AdminMarketing from './pages/AdminMarketing';
import AdminPromotions from './pages/AdminPromotions';
import AdminReviews from './pages/AdminReviews';
import AdminAppointments from './pages/AdminAppointments';
import AdminPieces from './pages/AdminPieces';
import AdminChats from './pages/AdminChats';
import AdminWeddingRings from './pages/AdminWeddingRings';
import AdminSettings from './pages/AdminSettings';
import AdminStaff from './pages/AdminStaff';
import NivodaTestingPage from '../pages/NivodaTestingPage';
import RingPricingTestPage from '../pages/RingPricingTestPage';
import AdminNivoda from './pages/AdminNivoda';

const AdminApp: React.FC = () => {
  return (
    <AdminAuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<AdminLogin />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <AdminProducts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <AdminCategories />
            </ProtectedRoute>
          }
        />

        <Route
          path="/jewelry-categories"
          element={
            <ProtectedRoute>
              <AdminJewelryCategories />
            </ProtectedRoute>
          }
        />

        <Route
          path="/watches"
          element={
            <ProtectedRoute>
              <AdminWatches />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <AdminOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/marketing"
          element={
            <ProtectedRoute>
              <AdminMarketing />
            </ProtectedRoute>
          }
        />

        <Route
          path="/promotions"
          element={
            <ProtectedRoute>
              <AdminPromotions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reviews"
          element={
            <ProtectedRoute>
              <AdminReviews />
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <AdminAppointments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pieces"
          element={
            <ProtectedRoute>
              <AdminPieces />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chats"
          element={
            <ProtectedRoute>
              <AdminChats />
            </ProtectedRoute>
          }
        />

        <Route
          path="/wedding-rings"
          element={
            <ProtectedRoute>
              <AdminWeddingRings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AdminSettings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff"
          element={
            <ProtectedRoute>
              <AdminStaff />
            </ProtectedRoute>
          }
        />

        <Route
          path="/nivoda"
          element={
            <ProtectedRoute>
              <AdminNivoda />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/nivoda"
          element={
            <ProtectedRoute>
              <NivodaTestingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/ring-pricing"
          element={
            <ProtectedRoute>
              <RingPricingTestPage />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AdminAuthProvider>
  );
};

export default AdminApp;