import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../stores/authStore";
import BrutalCard from "../components/ui/BrutalCard";
import BrutalInput from "../components/ui/BrutalInput";
import BrutalButton from "../components/ui/BrutalButton";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await register(username, email, password);
      navigate("/");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg ?? String(d)).join(", "));
      } else {
        setError("Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md px-4">
      <div className="text-center">
        <h1 className="font-pixel text-2xl text-neon">BNDT</h1>
        <p className="mt-2 font-retro text-xl text-muted-foreground">
          WARGAME BANDITS
        </p>
      </div>

      <BrutalCard shadow="lg" className="mt-8 p-6">
        <h2 className="font-pixel text-sm text-foreground">[REGISTER]</h2>
        {error && (
          <div className="mt-3 border-2 border-destructive bg-destructive/10 px-3 py-2">
            <p className="font-retro text-base text-destructive">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block font-retro text-base text-foreground"
            >
              Username
            </label>
            <BrutalInput
              id="username"
              type="text"
              required
              minLength={3}
              maxLength={50}
              pattern="^[a-zA-Z0-9_-]+$"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block font-retro text-base text-foreground"
            >
              Email
            </label>
            <BrutalInput
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block font-retro text-base text-foreground"
            >
              Password
            </label>
            <BrutalInput
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block font-retro text-base text-foreground"
            >
              Confirm Password
            </label>
            <BrutalInput
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1"
            />
          </div>
          <BrutalButton
            type="submit"
            variant="neon"
            disabled={loading}
            className="w-full"
          >
            {loading ? "REGISTERING..." : "REGISTER"}
          </BrutalButton>
        </form>
        <p className="mt-4 text-center font-retro text-base text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-neon underline underline-offset-2">
            Login
          </Link>
        </p>
      </BrutalCard>
    </div>
  );
}

export default Register;
