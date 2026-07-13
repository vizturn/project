import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Batasi akses berdasarkan role (samakan dengan middleware 'role:' backend).
// Pemakaian: <Route element={<RoleRoute allow={["AA","IA"]} />}> ... </Route>
export default function RoleRoute({ allow = [] }) {
  const { hasRole, loading } = useAuth();

  if (loading) return null;

  return hasRole(...allow) ? <Outlet /> : <Navigate to="/unauthorized" replace />;
}
