import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import AppLayout from "../components/AppLayout";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import ScreeningListPage from "../pages/ScreeningListPage";
import ScreeningPage from "../pages/ScreeningPage";
import PermitListPage from "../pages/PermitListPage";
import PermitFormPage from "../pages/PermitFormPage";
import PermitDetailPage from "../pages/PermitDetailPage";
import BoardPage from "../pages/BoardPage";
import NotificationsPage from "../pages/NotificationsPage";
import AuditLogPage from "../pages/AuditLogPage";
import ReportPage from "../pages/ReportPage";
import ProfilePage from "../pages/ProfilePage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        // Semua halaman ter-proteksi dibungkus AppLayout → dapat sidebar otomatis.
        element: <AppLayout />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/board", element: <BoardPage /> },
          { path: "/notifications", element: <NotificationsPage /> },
          { path: "/profile", element: <ProfilePage /> },

          // Penapisan
          { path: "/screening", element: <ScreeningListPage /> },
          {
            element: <RoleRoute allow={["PA"]} />,
            children: [{ path: "/screening/new", element: <ScreeningPage /> }],
          },

          // Izin Kerja (Permit)
          { path: "/permits", element: <PermitListPage /> },
          { path: "/permits/:id", element: <PermitDetailPage /> },
          {
            element: <RoleRoute allow={["PA"]} />,
            children: [
              { path: "/permits/new", element: <PermitFormPage /> },
              { path: "/permits/:id/edit", element: <PermitFormPage /> },
            ],
          },

          // Audit log & rekap: hanya SHE/ADM
          {
            element: <RoleRoute allow={["SHE", "ADM"]} />,
            children: [
              { path: "/audit-logs", element: <AuditLogPage /> },
              { path: "/reports", element: <ReportPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);
