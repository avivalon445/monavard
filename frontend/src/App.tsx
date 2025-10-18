import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import ToastManager from '@/components/common/ToastManager';

// Public Pages
import Home from '@/pages/public/Home';
import About from '@/pages/public/About';
import Contact from '@/pages/public/Contact';
import Login from '@/pages/public/Login';
import Register from '@/pages/public/Register';
import DevLogin from '@/pages/DevLogin';

// Customer Pages
import CustomerDashboard from '@/pages/customer/CustomerDashboard';
import Requests from '@/pages/customer/Requests';
import NewRequest from '@/pages/customer/NewRequest';
import RequestDetails from '@/pages/customer/RequestDetails';
import EditRequest from '@/pages/customer/EditRequest';
import Bids from '@/pages/customer/Bids';
import BidDetails from '@/pages/customer/BidDetails';
import Orders from '@/pages/customer/Orders';
import OrderDetails from '@/pages/customer/OrderDetails';
import Settings from '@/pages/customer/Settings';
import Notifications from '@/pages/customer/Notifications';
import CustomerLayout from '@/components/layout/CustomerLayout';

// Supplier Pages
import SupplierDashboard from '@/pages/supplier/SupplierDashboard';
import SupplierBids from '@/pages/supplier/SupplierBids';
import SupplierBidDetails from '@/pages/supplier/SupplierBidDetails';
import SupplierRequests from '@/pages/supplier/SupplierRequests';
import SupplierRequestDetails from '@/pages/supplier/SupplierRequestDetails';
import SupplierBidding from '@/pages/supplier/SupplierBidding';
import SupplierOrders from '@/pages/supplier/SupplierOrders';
import SupplierOrderDetailsPage from '@/pages/supplier/SupplierOrderDetails';
import SupplierAnalytics from '@/pages/supplier/SupplierAnalytics';
import SupplierProfile from '@/pages/supplier/SupplierProfile';
import SupplierPortfolio from '@/pages/supplier/SupplierPortfolio';
import SupplierFinancial from '@/pages/supplier/SupplierFinancial';
import SupplierSettingsPage from '@/pages/supplier/SupplierSettings';
import SupplierLayout from '@/components/layout/SupplierLayout';

// Layouts
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <Navbar />
    <main className="min-h-screen">{children}</main>
    <Footer />
  </>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <PublicLayout>
                <Home />
              </PublicLayout>
            }
          />
          <Route
            path="/login"
            element={
              <PublicLayout>
                <Login />
              </PublicLayout>
            }
          />
          <Route path="/dev-login" element={<DevLogin />} />
          <Route
            path="/register"
            element={
              <PublicLayout>
                <Register />
              </PublicLayout>
            }
          />
          <Route
            path="/about"
            element={
              <PublicLayout>
                <About />
              </PublicLayout>
            }
          />
          <Route
            path="/contact"
            element={
              <PublicLayout>
                <Contact />
              </PublicLayout>
            }
          />

          {/* Customer Routes */}
          <Route
            path="/dashboard/customer"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerLayout>
                  <CustomerDashboard />
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/requests"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerLayout>
                  <Requests />
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/requests/new"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <NewRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/requests/:id"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerLayout>
                  <RequestDetails />
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/requests/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <EditRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/bids"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerLayout>
                  <Bids />
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/bids/:id"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerLayout>
                  <BidDetails />
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/orders"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerLayout>
                  <Orders />
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/orders/:id"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerLayout>
                  <OrderDetails />
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/settings"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerLayout>
                  <Settings />
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/notifications"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerLayout>
                  <Notifications />
                </CustomerLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/*"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900">Coming Soon</h1>
                    <p className="text-gray-600 mt-2">This page is under development.</p>
                  </div>
                </CustomerLayout>
              </ProtectedRoute>
            }
          />

          {/* Supplier Routes */}
          <Route
            path="/dashboard/supplier"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <SupplierLayout>
                  <SupplierDashboard />
                </SupplierLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/bids"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <SupplierLayout>
                  <SupplierBids />
                </SupplierLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/bids/:id"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <SupplierLayout>
                  <SupplierBidDetails />
                </SupplierLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/requests"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <SupplierLayout>
                  <SupplierRequests />
                </SupplierLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/requests/:id"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <SupplierLayout>
                  <SupplierRequestDetails />
                </SupplierLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/requests/:id/bid"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <SupplierLayout>
                  <SupplierBidding />
                </SupplierLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/orders"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <SupplierLayout>
                  <SupplierOrders />
                </SupplierLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/orders/:id"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <SupplierLayout>
                  <SupplierOrderDetailsPage />
                </SupplierLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/analytics"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <SupplierLayout>
                  <SupplierAnalytics />
                </SupplierLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/profile"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <SupplierLayout>
                  <SupplierProfile />
                </SupplierLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/portfolio"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <SupplierLayout>
                  <SupplierPortfolio />
                </SupplierLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/financial"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <SupplierLayout>
                  <SupplierFinancial />
                </SupplierLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/settings"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <SupplierLayout>
                  <SupplierSettingsPage />
                </SupplierLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/*"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <SupplierLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900">Coming Soon</h1>
                    <p className="text-gray-600 mt-2">This page is under development.</p>
                  </div>
                </SupplierLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastManager />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

