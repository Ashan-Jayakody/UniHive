import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import RequestHelp from "./components/RequestHelp";
import MyInvitations from "./pages/Myinvitations";
import MyRequests from "./pages/MyRequests";
import ChatRoom from "./pages/ChatRoom";
import HelpBoard from "./pages/HelpBoard";
import UserManagement from "./pages/UserManagement";
import AcademicCommunication from "./pages/AcademicCommunication";
import AccessDenied from "./pages/AccessDenied";
import BlockedAccount from "./pages/BlockedAccount";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import AdminAnalytics from "./pages/AdminAnalytics";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import ResendVerification from "./pages/ResendVerification";
import ProtectedRoute from "./components/ProtectedRoute";
import PeerTutoring from "./pages/PeerTutoring";
import ResourceShare from "./pages/ResourceShare";
import ResourceAnalytics from "./pages/ResourceAnalytics";

const AppLayout = () => (
  <div className="min-h-screen bg-slate-50 ">
    <AppHeader />
    <div className="pt-14 pl-56">
      <Outlet />
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/resend-verification" element={<ResendVerification />} />
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route path="/blocked-account" element={<BlockedAccount />} />

        <Route element={<AppLayout />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/communication"
            element={
              <ProtectedRoute>
                <AcademicCommunication />
              </ProtectedRoute>
            }
          />

          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <RequestHelp />
              </ProtectedRoute>
            }
          />

          <Route
            path="/helpboard"
            element={
              <ProtectedRoute>
                <HelpBoard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/invitations"
            element={
              <ProtectedRoute>
                <MyInvitations />
              </ProtectedRoute>
            }
          />

          <Route
            path="/myrequests"
            element={ 
              <ProtectedRoute>
                <MyRequests />
              </ProtectedRoute>
            }
          />  

          <Route
            path="/chat/:id"
            element={ 
              <ProtectedRoute>
                <ChatRoom />
              </ProtectedRoute>
            }
          />  

          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/peerTutoring"
            element={
              <ProtectedRoute>
                <PeerTutoring />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin-analytics"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resourceShare"
            element={
              <ProtectedRoute>
                <ResourceShare />
              </ProtectedRoute>
            }
          />

          <Route
            path="/resource-analytics"
            element={
            <ProtectedRoute allowedRoles={["faculty", "admin"]}>
            <ResourceAnalytics />
            </ProtectedRoute>
  }
/>

        </Route>
      </Routes>
    </Router>
  );
}

export default App;
