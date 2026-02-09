import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="py-10">
      <div className="text-center">
        <h1 className="animate-glitch font-pixel text-3xl leading-relaxed text-primary">
          WARGAME
          <br />
          BANDITS
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Pwn / Reversing / Crypto / Web / Forensics / Misc
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          CTF Wargame Platform
          <span className="animate-blink ml-1 text-primary">_</span>
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/challenges"
            className="rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Start Hacking
          </Link>
          <Link
            to="/scoreboard"
            className="rounded-md border border-border px-6 py-3 font-medium hover:bg-accent/10"
          >
            Scoreboard
          </Link>
        </div>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Multi-Category",
            desc: "Pwn, Reversing, Crypto, Web, Forensics, Misc — 전 카테고리 지원",
            icon: "🎯",
          },
          {
            title: "Dynamic Instances",
            desc: "유저별 격리된 Docker 컨테이너로 Pwn/Web 문제 풀이",
            icon: "🐳",
          },
          {
            title: "Community",
            desc: "Write-up 공유, 유저 출제, 카테고리별 랭킹",
            icon: "👥",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/30"
          >
            <span className="text-2xl">{feature.icon}</span>
            <h3 className="mt-3 text-lg font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
