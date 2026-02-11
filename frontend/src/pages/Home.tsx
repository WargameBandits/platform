import { Link } from "react-router-dom";
import BrutalCard from "../components/ui/BrutalCard";
import BrutalButton from "../components/ui/BrutalButton";

function Home() {
  return (
    <div className="py-10">
      <div className="text-center">
        <h1 className="animate-glitch font-pixel text-3xl leading-relaxed text-foreground">
          WARGAME
          <br />
          <span className="text-neon">BANDITS</span>
        </h1>
        <p className="mt-6 font-retro text-2xl text-muted-foreground">
          Pwn / Reversing / Crypto / Web / Forensics / Misc
        </p>
        <p className="mt-2 font-retro text-xl text-muted-foreground">
          CTF Wargame Platform
          <span className="animate-blink ml-1 text-neon">_</span>
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/challenges">
            <BrutalButton variant="neon" size="lg">
              Start Hacking
            </BrutalButton>
          </Link>
          <Link to="/scoreboard">
            <BrutalButton variant="secondary" size="lg">
              Scoreboard
            </BrutalButton>
          </Link>
        </div>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Multi-Category",
            desc: "Pwn, Reversing, Crypto, Web, Forensics, Misc — All categories supported",
            marker: "[01]",
          },
          {
            title: "Dynamic Instances",
            desc: "Isolated Docker containers per user for Pwn/Web challenges",
            marker: "[02]",
          },
          {
            title: "Community",
            desc: "Share write-ups, submit challenges, compete on category rankings",
            marker: "[03]",
          },
        ].map((feature) => (
          <BrutalCard key={feature.title} hover className="p-6">
            <span className="font-pixel text-xs text-neon">
              {feature.marker}
            </span>
            <h3 className="mt-3 font-retro text-2xl text-foreground">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {feature.desc}
            </p>
          </BrutalCard>
        ))}
      </div>
    </div>
  );
}

export default Home;
