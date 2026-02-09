import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import type { Challenge } from "../types/challenge";
import type { ContainerInstance } from "../types/container";
import { fetchChallenge } from "../services/challenges";
import { createInstance, stopInstance } from "../services/containers";
import DifficultyBadge from "../components/challenge/DifficultyBadge";
import FlagSubmitForm from "../components/challenge/FlagSubmitForm";
import WebTerminal from "../components/terminal/WebTerminal";
import MarkdownRenderer from "../components/common/MarkdownRenderer";
import { getCategoryColor } from "../utils/categoryColors";

function ChallengeDetail() {
  const { id } = useParams<{ id: string }>();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 동적 인스턴스 상태
  const [instance, setInstance] = useState<ContainerInstance | null>(null);
  const [instanceLoading, setInstanceLoading] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchChallenge(Number(id))
      .then(setChallenge)
      .catch(() => setError("챌린지를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStartInstance = async () => {
    if (!challenge) return;
    setInstanceLoading(true);
    try {
      const inst = await createInstance(challenge.id);
      setInstance(inst);
    } catch (e: any) {
      const msg = e.response?.data?.detail ?? "인스턴스 생성에 실패했습니다.";
      alert(msg);
    } finally {
      setInstanceLoading(false);
    }
  };

  const handleStopInstance = async () => {
    if (!instance) return;
    setInstanceLoading(true);
    try {
      await stopInstance(instance.id);
      setInstance(null);
      setShowTerminal(false);
    } catch {
      alert("인스턴스 중지에 실패했습니다.");
    } finally {
      setInstanceLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="text-destructive">{error ?? "Not found"}</p>
        <Link
          to="/challenges"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          Back to Challenges
        </Link>
      </div>
    );
  }

  const token = localStorage.getItem("access_token") ?? "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        to="/challenges"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back to Challenges
      </Link>

      <div className="mt-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{challenge.title}</h1>
            <div className="mt-2 flex items-center gap-3">
              <span
                className={`rounded border px-2 py-0.5 text-xs font-medium uppercase ${getCategoryColor(challenge.category).bg} ${getCategoryColor(challenge.category).text} ${getCategoryColor(challenge.category).border}`}
              >
                {challenge.category}
              </span>
              <DifficultyBadge difficulty={challenge.difficulty} />
              <span className="text-sm text-muted-foreground">
                {challenge.solve_count} solves
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {challenge.points}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                pts
              </span>
            </div>
          </div>
        </div>

        {/* 설명 */}
        <div className="mt-6 rounded-lg border border-border bg-card p-6">
          <MarkdownRenderer content={challenge.description} />
        </div>

        {/* 동적 인스턴스 관리 */}
        {challenge.is_dynamic && (
          <div className="mt-4 rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-medium">Dynamic Instance</h3>

            {instance ? (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    {instance.connection_info.startsWith("http") ? (
                      <a
                        href={instance.connection_info}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded bg-muted px-2 py-1 font-mono text-sm text-primary hover:underline"
                      >
                        {instance.connection_info}
                      </a>
                    ) : (
                      <code className="rounded bg-muted px-2 py-1 font-mono text-sm text-primary">
                        {instance.connection_info}
                      </code>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Expires:{" "}
                      {new Date(instance.expires_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowTerminal(!showTerminal)}
                      className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
                    >
                      {showTerminal ? "Hide Terminal" : "Web Terminal"}
                    </button>
                    <button
                      onClick={handleStopInstance}
                      disabled={instanceLoading}
                      className="rounded-md bg-destructive px-3 py-1.5 text-sm text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                    >
                      Stop
                    </button>
                  </div>
                </div>

                {showTerminal && token && (
                  <WebTerminal instanceId={instance.id} token={token} />
                )}
              </div>
            ) : (
              <button
                onClick={handleStartInstance}
                disabled={instanceLoading}
                className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {instanceLoading ? "Starting..." : "Start Instance"}
              </button>
            )}
          </div>
        )}

        {/* 파일 다운로드 */}
        {challenge.files && challenge.files.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-muted-foreground">Files</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {challenge.files.map((file) => (
                <a
                  key={file}
                  href={`/files/${challenge.id}/${file}`}
                  download
                  className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
                >
                  {file}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 태그 */}
        {challenge.tags && challenge.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1">
            {challenge.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 힌트 */}
        {challenge.hints && challenge.hints.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-muted-foreground">Hints</h3>
            <div className="mt-2 space-y-2">
              {challenge.hints.map((hint, idx) => (
                <details
                  key={idx}
                  className="rounded-md border border-border p-3"
                >
                  <summary className="cursor-pointer text-sm">
                    Hint {idx + 1}{" "}
                    <span className="text-muted-foreground">
                      (-{hint.cost} pts)
                    </span>
                  </summary>
                  <p className="mt-2 text-sm">{hint.content}</p>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* 플래그 제출 */}
        <FlagSubmitForm
          challengeId={challenge.id}
          isSolved={challenge.is_solved}
        />
      </div>
    </div>
  );
}

export default ChallengeDetail;
