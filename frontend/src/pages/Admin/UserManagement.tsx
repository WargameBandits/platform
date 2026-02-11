import { useEffect, useState } from "react";
import {
  fetchUsers,
  updateUserRole,
  type AdminUser,
} from "../../services/admin";
import BrutalInput from "../../components/ui/BrutalInput";
import BrutalButton from "../../components/ui/BrutalButton";
import PixelLoader from "../../components/common/PixelLoader";
import { errorToast } from "../../components/common/Toast";

function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadUsers = (q?: string) => {
    setLoading(true);
    fetchUsers(q)
      .then((res) => {
        setUsers(res.items);
        setTotal(res.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(search || undefined);
  };

  const handleRoleChange = async (userId: number, role: string) => {
    try {
      await updateUserRole(userId, role);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
    } catch {
      errorToast("UPDATE FAILED", "Failed to update role.");
    }
  };

  return (
    <div>
      <h1 className="font-pixel text-lg text-foreground">[USER_MANAGEMENT]</h1>
      <p className="mt-1 font-retro text-sm text-muted-foreground">
        {total} users total
      </p>

      <form onSubmit={handleSearch} className="mt-4 flex gap-2">
        <BrutalInput
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search username..."
          className="flex-1 text-sm"
        />
        <BrutalButton type="submit" variant="primary">
          Search
        </BrutalButton>
      </form>

      {loading ? (
        <PixelLoader text="LOADING USERS" className="mt-8" />
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-foreground text-background">
                <th className="border-b-2 border-border px-3 py-2 text-left font-retro text-xs uppercase">
                  ID
                </th>
                <th className="border-b-2 border-border px-3 py-2 text-left font-retro text-xs uppercase">
                  Username
                </th>
                <th className="border-b-2 border-border px-3 py-2 text-left font-retro text-xs uppercase">
                  Email
                </th>
                <th className="border-b-2 border-border px-3 py-2 text-left font-retro text-xs uppercase">
                  Score
                </th>
                <th className="border-b-2 border-border px-3 py-2 text-left font-retro text-xs uppercase">
                  Solved
                </th>
                <th className="border-b-2 border-border px-3 py-2 text-left font-retro text-xs uppercase">
                  Role
                </th>
                <th className="border-b-2 border-border px-3 py-2 text-left font-retro text-xs uppercase">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr
                  key={u.id}
                  className={idx % 2 === 1 ? "bg-muted/50" : ""}
                >
                  <td className="border-b-2 border-border px-3 py-2 font-mono font-retro text-sm text-muted-foreground">
                    {u.id}
                  </td>
                  <td className="border-b-2 border-border px-3 py-2 font-retro text-sm font-medium text-foreground">
                    {u.username}
                  </td>
                  <td className="border-b-2 border-border px-3 py-2 font-retro text-sm text-muted-foreground">
                    {u.email}
                  </td>
                  <td className="border-b-2 border-border px-3 py-2 font-retro text-sm text-neon">
                    {u.total_score}
                  </td>
                  <td className="border-b-2 border-border px-3 py-2 font-retro text-sm">
                    {u.solved_count}
                  </td>
                  <td className="border-b-2 border-border px-3 py-2">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="border-2 border-border bg-background px-2 py-1 font-retro text-xs focus:border-neon focus:outline-none"
                    >
                      <option value="user">user</option>
                      <option value="challenge_author">author</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="border-b-2 border-border px-3 py-2 font-retro text-xs text-muted-foreground">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
