import useAuthStore from "../stores/authStore";
import BrutalCard from "../components/ui/BrutalCard";
import BrutalBadge from "../components/ui/BrutalBadge";
import MetricsCard from "../components/dashboard/MetricsCard";

function Profile() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return (
      <div className="border-2 border-border p-8 text-center">
        <p className="font-retro text-xl text-muted-foreground">
          Please login to view your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-pixel text-lg text-foreground">[PROFILE]</h1>

      {/* User Info */}
      <BrutalCard className="p-6">
        <div className="flex items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center border-2 border-neon bg-neon/20 font-pixel text-2xl text-neon">
            {user.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <h2 className="font-pixel text-base text-foreground">
              {user.username}
            </h2>
            <p className="mt-1 font-retro text-lg text-muted-foreground">
              {user.email}
            </p>
            <BrutalBadge variant="purple" className="mt-2">
              {user.role}
            </BrutalBadge>
          </div>
        </div>
      </BrutalCard>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          label="Total Score"
          value={`${user.total_score.toLocaleString()} PTS`}
          accent="neon"
        />
        <MetricsCard
          label="Solved"
          value={user.solved_count}
        />
        <MetricsCard
          label="Joined"
          value={new Date(user.created_at).toLocaleDateString()}
        />
        <MetricsCard
          label="Last Login"
          value={
            user.last_login
              ? new Date(user.last_login).toLocaleDateString()
              : "N/A"
          }
        />
      </div>

      {/* Account Info */}
      <BrutalCard className="p-6">
        <h3 className="font-pixel text-[10px] text-foreground uppercase">
          [Account Info]
        </h3>
        <div className="mt-4 space-y-3">
          <div className="flex justify-between border-b border-border/30 pb-2">
            <span className="font-retro text-base text-muted-foreground">
              Joined
            </span>
            <span className="font-retro text-base text-foreground">
              {new Date(user.created_at).toLocaleDateString()}
            </span>
          </div>
          {user.last_login && (
            <div className="flex justify-between border-b border-border/30 pb-2">
              <span className="font-retro text-base text-muted-foreground">
                Last Login
              </span>
              <span className="font-retro text-base text-foreground">
                {new Date(user.last_login).toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex justify-between border-b border-border/30 pb-2">
            <span className="font-retro text-base text-muted-foreground">
              Role
            </span>
            <span className="font-retro text-base text-foreground uppercase">
              {user.role}
            </span>
          </div>
        </div>
      </BrutalCard>
    </div>
  );
}

export default Profile;
