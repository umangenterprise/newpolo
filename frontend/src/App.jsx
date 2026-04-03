import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layout/MainLayout.jsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage.jsx";
import AdminProductsPage from "./pages/admin/AdminProductsPage.jsx";
import AdminUsersPage from "./pages/admin/AdminUsersPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import ProductDetailsPage from "./pages/ProductDetailsPage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import { useApp } from "./context/useApp.jsx";

const ProtectedRoute = ({ children }) => {
  const { user } = useApp();
  return user ? children : <Navigate to="/auth" replace />;
};

const GuestRoute = ({ children }) => {
  const { user } = useApp();
  if (!user) return children;
  return <Navigate to={user.role === "admin" ? "/admin" : "/"} replace />;
};

const AdminRoute = ({ children }) => {
  const { user } = useApp();
  if (!user) return <Navigate to="/auth" replace />;
  return user.role === "admin" ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <ProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id"
          element={
            <ProtectedRoute>
              <ProductDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auth"
          element={
            <GuestRoute>
              <AuthPage />
            </GuestRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <AdminProductsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <AdminOrdersPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
