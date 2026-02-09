import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Outlet />
    </div>
  );
}

export default Layout;
