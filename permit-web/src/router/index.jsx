import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import AppLayout from "../components/AppLayout";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import ScreeningListPage from "../pages/ScreeningListPage";
import ScreeningPage from "../pages/ScreeningPage";
import PermitListPage from "../pages/PermitListPage";
import PermitFormPage from "../pages/PermitFormPage";
import PermitDetailPage from "../pages/PermitDetailPage";
import PermitPrintPage from "../pages/PermitPrintPage";
import BoardPage from "../pages/BoardPage";
import NotificationsPage from "../pages/NotificationsPage";
import AuditLogPage from "../pages/AuditLogPage";
import ReportPage from "../pages/ReportPage";
import ProfilePage from "../pages/ProfilePage";
import AccountApprovalPage from "../pages/AccountApprovalPage";
import AccountManagePage from "../pages/AccountManagePage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      // Lembar cetak PTW — di luar AppLayout (tanpa sidebar) agar bersih untuk print.
      { path: "/permits/:id/print", element: <PermitPrintPage /> },
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

          // Persetujuan akun: hanya SHE
          {
            element: <RoleRoute allow={["SHE"]} />,
            children: [
              { path: "/accounts/approval", element: <AccountApprovalPage /> },
            ],
          },

          // Kelola akun (nonaktif/hapus): hanya ADM (ICT)
          {
            element: <RoleRoute allow={["ADM"]} />,
            children: [
              { path: "/accounts/manage", element: <AccountManagePage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);
