import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  type Notification,
} from "../../services/notifications";
import BrutalButton from "../ui/BrutalButton";

function TopBar() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const load = () => {
      fetchNotifications(10)
        .then((res) => {
          setNotifications(res.items);
          setUnreadCount(res.unread_count);
        })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    if (notif.challenge_id) {
      navigate(`/challenges/${notif.challenge_id}`);
    }
    setShowDropdown(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b-2 border-border bg-background px-6">
      {/* Left: Greeting */}
      <div>
        {user ? (
          <h2 className="font-pixel text-[10px] text-foreground">
            WELCOME BACK, {user.username.toUpperCase()}
            <span className="text-neon animate-blink">_</span>
          </h2>
        ) : (
          <h2 className="font-pixel text-[10px] text-foreground">
            WARGAME BANDITS
            <span className="text-neon animate-blink">_</span>
          </h2>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {user ? (
          <>
            {/* Notification Bell */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative border-2 border-border p-2 text-foreground hover:bg-muted transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center border-2 border-border bg-neon px-1 font-pixel text-[8px] text-black">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-80 border-2 border-border bg-card shadow-brutal dark:shadow-brutal-neon">
                  <div className="flex items-center justify-between border-b-2 border-border px-4 py-3">
                    <span className="font-pixel text-[8px] uppercase">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="font-retro text-sm text-neon hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center font-retro text-base text-muted-foreground">
                        No notifications
                      </p>
                    ) : (
                      notifications.map((n, idx) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className={`block w-full px-4 py-3 text-left hover:bg-neon/5 border-b border-border/30 ${
                            idx % 2 === 1 ? "bg-muted/30" : ""
                          } ${!n.is_read ? "border-l-4 border-l-neon" : ""}`}
                        >
                          <p className="font-retro text-base text-foreground">
                            {n.title}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                            {n.message}
                          </p>
                          <p className="mt-1 font-retro text-xs text-muted-foreground">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link to="/profile">
              <BrutalButton variant="ghost" size="sm">
                {user.username}
              </BrutalButton>
            </Link>
          </>
        ) : (
          <>
            <Link to="/login">
              <BrutalButton variant="ghost" size="sm">
                Login
              </BrutalButton>
            </Link>
            <Link to="/register">
              <BrutalButton variant="neon" size="sm">
                Register
              </BrutalButton>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default TopBar;
