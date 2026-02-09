import useAuthStore from "../stores/authStore";

function Profile() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Please login to view your profile.
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Profile</h1>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* User info card */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {user.username?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.username}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Stats card */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Stats</h3>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-primary">
                {user.total_score}
              </p>
              <p className="text-xs text-muted-foreground">Total Score</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{user.solved_count}</p>
              <p className="text-xs text-muted-foreground">Problems Solved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account info */}
      <div className="mt-6 rounded-lg border border-border bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground">
          Account Info
        </h3>
        <div className="mt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Joined</span>
            <span>{new Date(user.created_at).toLocaleDateString()}</span>
          </div>
          {user.last_login && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Login</span>
              <span>{new Date(user.last_login).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
