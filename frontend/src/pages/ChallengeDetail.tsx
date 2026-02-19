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
import BrutalCard from "../components/ui/BrutalCard";
import BrutalButton from "../components/ui/BrutalButton";
import BrutalBadge from "../components/ui/BrutalBadge";
import PixelLoader from "../components/common/PixelLoader";
import { errorToast } from "../components/common/Toast";
import { API_BASE_URL } from "../services/api";
import { extractApiError } from "../utils/apiError";

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
    } catch (e: unknown) {
      errorToast("INSTANCE ERROR", extractApiError(e, "인스턴스 생성에 실패했습니다."));
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
      errorToast("INSTANCE ERROR", "인스턴스 중지에 실패했습니다.");
    } finally {
      setInstanceLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20">
        <PixelLoader text="LOADING CHALLENGE" />
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="font-retro text-lg text-destructive">{error ?? "Not found"}</p>
        <Link
          to="/challenges"
          className="mt-4 inline-block font-retro text-sm text-neon hover:underline"
        >
          &lt; BACK TO CHALLENGES
        </Link>
      </div>
    );
  }

  const token = localStorage.getItem("access_token") ?? "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        to="/challenges"
        className="font-retro text-sm text-muted-foreground transition-colors hover:text-neon"
      >
        &lt; BACK TO CHALLENGES
      </Link>

      <div className="mt-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-pixel text-lg text-foreground sm:text-xl">
              [{challenge.title.toUpperCase()}]
            </h1>
            <div className="mt-3 flex items-center gap-3">
              <BrutalBadge variant="purple">
                {challenge.category}
              </BrutalBadge>
              <DifficultyBadge difficulty={challenge.difficulty} />
              <span className="font-retro text-sm text-muted-foreground">
                {challenge.solve_count} solves
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-pixel text-xl text-neon">
              {challenge.points}
              <span className="font-retro text-sm text-muted-foreground">
                {" "}
                PTS
              </span>
            </div>
          </div>
        </div>

        {/* 설명 */}
        <BrutalCard className="mt-6 p-6">
          <MarkdownRenderer content={challenge.description} />
        </BrutalCard>

        {/* 동적 인스턴스 관리 */}
        {challenge.is_dynamic && (
          <BrutalCard className="mt-4 p-4">
            <h3 className="font-retro text-sm uppercase text-muted-foreground">
              Dynamic Instance
            </h3>

            {instance ? (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="border-2 border-neon bg-neon/10 px-3 py-2">
                      {instance.connection_info.startsWith("http") ? (
                        <a
                          href={instance.connection_info}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm text-neon hover:underline"
                        >
                          {instance.connection_info}
                        </a>
                      ) : (
                        <code className="font-mono text-sm text-neon">
                          {instance.connection_info}
                        </code>
                      )}
                    </div>
                    <p className="mt-1 font-retro text-xs text-muted-foreground">
                      Expires:{" "}
                      {new Date(instance.expires_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <BrutalButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowTerminal(!showTerminal)}
                    >
                      {showTerminal ? "Hide Terminal" : "Web Terminal"}
                    </BrutalButton>
                    <BrutalButton
                      variant="destructive"
                      size="sm"
                      onClick={handleStopInstance}
                      disabled={instanceLoading}
                    >
                      Stop
                    </BrutalButton>
                  </div>
                </div>

                {showTerminal && token && (
                  <WebTerminal instanceId={instance.id} token={token} />
                )}
              </div>
            ) : (
              <BrutalButton
                variant="primary"
                className="mt-3"
                onClick={handleStartInstance}
                disabled={instanceLoading}
              >
                {instanceLoading ? "Starting..." : "Start Instance"}
              </BrutalButton>
            )}
          </BrutalCard>
        )}

        {/* 파일 다운로드 */}
        {challenge.files && challenge.files.length > 0 && (
          <BrutalCard className="mt-4 p-4">
            <h3 className="font-retro text-sm uppercase text-muted-foreground">
              Files
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {challenge.files.map((file) => (
                <a
                  key={file}
                  href={`${API_BASE_URL}/challenges/${challenge.id}/files/${encodeURIComponent(file)}`}
                  download
                >
                  <BrutalButton variant="ghost" size="sm" className="border-2 border-border">
                    {file}
                  </BrutalButton>
                </a>
              ))}
            </div>
          </BrutalCard>
        )}

        {/* 태그 */}
        {challenge.tags && challenge.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {challenge.tags.map((tag) => (
              <span
                key={tag}
                className="font-retro text-sm text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 힌트 */}
        {challenge.hints && challenge.hints.length > 0 && (
          <BrutalCard className="mt-4 p-4">
            <h3 className="font-retro text-sm uppercase text-muted-foreground">
              Hints
            </h3>
            <div className="mt-2 space-y-2">
              {challenge.hints.map((hint, idx) => (
                <details
                  key={idx}
                  className="border-2 border-border p-3"
                >
                  <summary className="cursor-pointer font-retro text-sm">
                    Hint {idx + 1}{" "}
                    <span className="text-muted-foreground">
                      (-{hint.cost} pts)
                    </span>
                  </summary>
                  <p className="mt-2 font-retro text-sm">{hint.content}</p>
                </details>
              ))}
            </div>
          </BrutalCard>
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
