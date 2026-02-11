import { Outlet } from "react-router-dom";
import ThemeToggle from "../common/ThemeToggle";

function Layout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>
      <Outlet />
    </div>
  );
}

export default Layout;
