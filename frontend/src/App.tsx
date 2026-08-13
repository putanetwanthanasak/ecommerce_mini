import { Navigate, Route, Routes } from "react-router-dom";
import { GuestOnlyRoute, ProtectedRoute } from "./auth/ProtectedRoute";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
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
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      {/* No 404 page yet — there's only one real route to get wrong. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
