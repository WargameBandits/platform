import { Link, useLocation } from "react-router-dom";
import useAuthStore from "../../stores/authStore";

const navItems = [
  { path: "/", label: "Home", icon: "🏠" },
  { path: "/challenges", label: "Challenges", icon: "⚔️" },
  { path: "/scoreboard", label: "Scoreboard", icon: "🏆" },
  { path: "/writeups", label: "Write-ups", icon: "📝" },
];

const authItems = [
  { path: "/submit-challenge", label: "Submit Challenge", icon: "✏️" },
  { path: "/my-submissions", label: "My Submissions", icon: "📋" },
];

const adminItems = [
  { path: "/admin", label: "Dashboard", icon: "📊" },
  { path: "/admin/reviews", label: "Reviews", icon: "🔍" },
  { path: "/admin/users", label: "Users", icon: "👥" },
];

const ADMIN_ROLES = ["admin", "challenge_author"];

function Sidebar() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user && ADMIN_ROLES.includes(user.role);

  const renderLink = (item: { path: string; label: string; icon: string }) => {
    const isActive =
      item.path === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.path);

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-primary/10 text-primary"
            : "text-sidebar-foreground hover:bg-accent/10 hover:text-accent"
        }`}
      >
        <span className="text-base">{item.icon}</span>
        {item.label}
      </Link>
    );
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-pixel text-xs text-primary">WB</span>
          <span className="text-sm font-bold text-sidebar-foreground">
            Wargame Bandits
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map(renderLink)}

        {user && (
          <>
            <div className="my-3 border-t border-sidebar-border" />
            <p className="px-3 text-xs font-medium uppercase text-muted-foreground">
              Community
            </p>
            {authItems.map(renderLink)}
          </>
        )}

        {isAdmin && (
          <>
            <div className="my-3 border-t border-sidebar-border" />
            <p className="px-3 text-xs font-medium uppercase text-muted-foreground">
              Admin
            </p>
            {adminItems.map(renderLink)}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border px-3 py-4">
        {user ? (
          <Link
            to="/profile"
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              location.pathname === "/profile"
                ? "bg-primary/10 text-primary"
                : "text-sidebar-foreground hover:bg-accent/10 hover:text-accent"
            }`}
          >
            <span className="text-base">👤</span>
            {user.username}
          </Link>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-accent/10 hover:text-accent"
          >
            <span className="text-base">🔑</span>
            Login
          </Link>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
