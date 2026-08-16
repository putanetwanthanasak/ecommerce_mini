import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { GuestOnlyRoute, ProtectedRoute } from "./auth/ProtectedRoute";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { OrderConfirmationPage } from "./pages/OrderConfirmationPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { ProductListPage } from "./pages/ProductListPage";
import { RegisterPage } from "./pages/RegisterPage";

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestOnlyRoute>
            <LoginPage />
          </GuestOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestOnlyRoute>
            <RegisterPage />
          </GuestOnlyRoute>
        }
      />

      {/* One gate for every signed-in page, rather than a ProtectedRoute
          wrapper repeated per route — a route added below is protected by
          default, which is the safer way for this list to grow.

          The catalog is public data, but it stays behind the gate for now: the
          rest of the app assumes a session, and letting one page render without
          one would mean a second set of rules for the header, the log-out
          button and the 401 handling. */}
      <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        {/* One order, straight after placing it. The order *history* list is a
            later round; this route is the confirmation. */}
        <Route path="/orders/:id" element={<OrderConfirmationPage />} />
        <Route path="/account" element={<HomePage />} />
      </Route>

      {/* The catalog is the home page. `replace` keeps "/" out of history so
          Back from the catalog doesn't bounce through the redirect. */}
      <Route path="/" element={<Navigate to="/products" replace />} />
      <Route path="*" element={<Navigate to="/products" replace />} />
    </Routes>
  );
}
