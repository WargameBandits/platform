import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";
import ThemeToggle from "../common/ThemeToggle";

const navItems = [
  { path: "/", label: "Dashboard", marker: ">" },
  { path: "/challenges", label: "Challenges", marker: ">" },
  { path: "/scoreboard", label: "Scoreboard", marker: ">" },
  { path: "/writeups", label: "Write-ups", marker: ">" },
];

const authItems = [
  { path: "/submit-challenge", label: "Submit", marker: "+" },
  { path: "/my-submissions", label: "My Subs", marker: "#" },
];

const adminItems = [
  { path: "/admin", label: "Admin", marker: "!" },
  { path: "/admin/reviews", label: "Reviews", marker: "?" },
  { path: "/admin/users", label: "Users", marker: "@" },
];

const ADMIN_ROLES = ["admin", "challenge_author"];

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = user && ADMIN_ROLES.includes(user.role);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderLink = (item: {
    path: string;
    label: string;
    marker: string;
  }) => {
    const isActive =
      item.path === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.path);

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center gap-3 border-2 px-3 py-2 font-retro text-lg transition-all duration-100 ${
          isActive
            ? "border-border bg-foreground text-neon shadow-brutal-sm dark:shadow-[2px_2px_0px_0px_#00FF41] -translate-x-0.5 -translate-y-0.5"
            : "border-transparent text-foreground hover:border-border hover:bg-muted"
        }`}
      >
        <span className="font-mono text-xs text-neon">{item.marker}</span>
        {item.label}
      </Link>
    );
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r-2 border-border bg-background">
      {/* Logo */}
      <div className="border-b-2 border-border px-4 py-5">
        <Link to="/" className="block">
          <span className="font-pixel text-xl text-neon">BNDT</span>
          <p className="font-retro text-base text-muted-foreground mt-1">
            WARGAME BANDITS
          </p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map(renderLink)}

        {user && (
          <>
            <div className="my-3 border-t-2 border-border" />
            <p className="px-3 font-pixel text-[8px] uppercase text-muted-foreground">
              Community
            </p>
            <div className="mt-2 space-y-1">
              {authItems.map(renderLink)}
            </div>
          </>
        )}

        {isAdmin && (
          <>
            <div className="my-3 border-t-2 border-border" />
            <p className="px-3 font-pixel text-[8px] uppercase text-muted-foreground">
              Admin
            </p>
            <div className="mt-2 space-y-1">
              {adminItems.map(renderLink)}
            </div>
          </>
        )}
      </nav>

      {/* Bottom: Theme Toggle + User */}
      <div className="border-t-2 border-border px-3 py-3 space-y-3">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        {user ? (
          <div className="border-2 border-border p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center border-2 border-neon bg-neon/20 font-pixel text-xs text-neon">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-retro text-base text-foreground truncate">
                  {user.username}
                </p>
                <p className="font-retro text-sm text-muted-foreground">
                  {user.role.toUpperCase()}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-2 w-full border-2 border-border bg-background px-2 py-1 font-retro text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              LOGOUT
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="block border-2 border-border px-3 py-2 text-center font-retro text-lg text-foreground hover:bg-neon hover:text-black transition-colors"
          >
            LOGIN
          </Link>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
