import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../../stores/authStore";
import PixelLoader from "./PixelLoader";

function ProtectedRoute() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PixelLoader text="AUTHENTICATING" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
