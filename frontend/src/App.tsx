import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Challenges from "./pages/Challenges";
import ChallengeDetail from "./pages/ChallengeDetail";
import Scoreboard from "./pages/Scoreboard";
import Profile from "./pages/Profile";
import Writeups from "./pages/Writeups";
import SubmitChallenge from "./pages/SubmitChallenge";
import MySubmissions from "./pages/MySubmissions";
import AdminDashboard from "./pages/Admin/Dashboard";
import ChallengeReview from "./pages/Admin/ChallengeReview";
import UserManagement from "./pages/Admin/UserManagement";
import useAuthStore from "./stores/authStore";

function App() {
  const fetchUser = useAuthStore((s) => s.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <Routes>
      {/* Public routes (no sidebar) */}
      <Route element={<Layout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* App routes (sidebar + topbar) */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/challenges/:id" element={<ChallengeDetail />} />
        <Route path="/scoreboard" element={<Scoreboard />} />
        <Route path="/writeups" element={<Writeups />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/submit-challenge" element={<SubmitChallenge />} />
          <Route path="/my-submissions" element={<MySubmissions />} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/reviews" element={<ChallengeReview />} />
          <Route path="/admin/users" element={<UserManagement />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
