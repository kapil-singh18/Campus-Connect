import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import TopNotificationBar from "./components/TopNotificationBar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import FloatingChatbot from "./components/FloatingChatbot.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import LoginFormPage from "./pages/LoginFormPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ClubsPage from "./pages/ClubsPage.jsx";
import ClubDetailsPage from "./pages/ClubDetailsPage.jsx";
import EventsPage from "./pages/EventsPage.jsx";
import EventDetailsPage from "./pages/EventDetailsPage.jsx";
import AskDoubtPage from "./pages/AskDoubtPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
import LeaderboardPage from "./pages/LeaderboardPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const Loader = () => (
  <div style={{
    display: "flex", minHeight: "100vh", alignItems: "center",
    justifyContent: "center", background: "var(--bg)",
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: "50%",
      border: "3px solid var(--border)",
      borderTopColor: "var(--brand)",
      animation: "spin 0.7s linear infinite",
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Full-screen pages that manage their own layout (no main padding needed)
const FULLSCREEN_ROUTES = ["/ask-doubt"];

function AppInner() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader />;

  const isFullscreen = user && FULLSCREEN_ROUTES.includes(location.pathname);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      {user ? <Sidebar /> : null}
      {user ? <TopNotificationBar /> : null}

      {/* Main content — hidden for fullscreen routes (they self-position) */}
      {!isFullscreen && (
        <main
          style={user ? {
            marginLeft: "var(--sidebar-w, 260px)",
            paddingTop: "calc(var(--topbar-h, 64px) + 1.5rem)",
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
            paddingBottom: "2rem",
            minHeight: "100vh",
            transition: "margin-left 0.3s ease",
          } : {
            maxWidth: "80rem",
            margin: "0 auto",
            padding: "1.5rem 1rem 4rem",
          }}
        >
          <Routes>
            <Route path="/"        element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/login"   element={<GuestRoute><LoginFormPage /></GuestRoute>} />
            <Route path="/signup"  element={<GuestRoute><SignupPage /></GuestRoute>} />

            <Route path="/dashboard"     element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/clubs"         element={<ProtectedRoute><ClubsPage /></ProtectedRoute>} />
            <Route path="/clubs/:id"     element={<ProtectedRoute><ClubDetailsPage /></ProtectedRoute>} />
            <Route path="/events"        element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
            <Route path="/events/:id"    element={<ProtectedRoute><EventDetailsPage /></ProtectedRoute>} />
            <Route path="/profile"       element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/analytics"     element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/leaderboard"   element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
            <Route path="/settings"      element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

            <Route path="/landing" element={<Navigate to="/" replace />} />
            <Route path="*"        element={<NotFoundPage />} />
          </Routes>
        </main>
      )}

      {/* Fullscreen routes rendered outside main (they use position:fixed) */}
      {isFullscreen && (
        <Routes>
          <Route path="/ask-doubt" element={<ProtectedRoute><AskDoubtPage /></ProtectedRoute>} />
        </Routes>
      )}

      {user ? <FloatingChatbot /> : null}
    </div>
  );
}

function App() {
  return <AppInner />;
}

export default App;
