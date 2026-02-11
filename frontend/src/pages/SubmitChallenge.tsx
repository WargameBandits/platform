import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import MarkdownRenderer from "../components/common/MarkdownRenderer";
import { submitChallenge } from "../services/community";
import { getCategoryColor } from "../utils/categoryColors";
import BrutalCard from "../components/ui/BrutalCard";
import BrutalButton from "../components/ui/BrutalButton";
import BrutalInput from "../components/ui/BrutalInput";
import BrutalBadge from "../components/ui/BrutalBadge";

const categories = ["pwn", "reversing", "crypto", "web", "forensics", "misc"];
const difficulties = [
  { value: 1, label: "Baby" },
  { value: 2, label: "Easy" },
  { value: 3, label: "Medium" },
  { value: 4, label: "Hard" },
  { value: 5, label: "Insane" },
];

const FLAG_REGEX = /^BNDT\{.+\}$/;

interface Hint {
  cost: number;
  content: string;
}

function SubmitChallenge() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("pwn");
  const [difficulty, setDifficulty] = useState(1);
  const [flag, setFlag] = useState("");
  const [flagType, setFlagType] = useState("static");
  const [tags, setTags] = useState("");
  const [hints, setHints] = useState<Hint[]>([]);
  const [authorNotes, setAuthorNotes] = useState("");
  const [previewTab, setPreviewTab] = useState<"edit" | "preview">("edit");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flagValid = FLAG_REGEX.test(flag);

  const addHint = () => {
    setHints([...hints, { cost: 50, content: "" }]);
  };

  const updateHint = (index: number, field: keyof Hint, value: string | number) => {
    const updated = [...hints];
    updated[index] = { ...updated[index], [field]: value } as Hint;
    setHints(updated);
  };

  const removeHint = (index: number) => {
    setHints(hints.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!flagValid) {
      setError("플래그는 BNDT{...} 형식이어야 합니다.");
      return;
    }

    setLoading(true);
    try {
      await submitChallenge({
        title,
        description,
        category,
        difficulty,
        flag,
        flag_type: flagType,
        hints: hints.length > 0 ? hints : undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      navigate("/my-submissions");
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "제출에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const catColor = getCategoryColor(category);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-pixel text-lg text-foreground">[SUBMIT_CHALLENGE]</h1>
      <p className="mt-2 font-retro text-sm text-muted-foreground">
        커뮤니티 챌린지를 제출하세요. 관리자 심사 후 공개됩니다.
      </p>

      {error && (
        <div className="mt-4 border-2 border-destructive bg-destructive/10 px-4 py-3">
          <span className="font-retro text-sm text-destructive">{error}</span>
        </div>
      )}

      <BrutalCard className="mt-6 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="font-retro text-sm uppercase text-muted-foreground">
              Title <span className="text-destructive">*</span>
            </label>
            <BrutalInput
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="mt-1"
              placeholder="문제 제목"
            />
          </div>

          {/* Category + Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-retro text-sm uppercase text-muted-foreground">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full border-2 border-border bg-background px-3 py-2 font-retro text-sm focus:border-neon focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className={`inline-block h-2 w-2 ${catColor.bg}`}
                />
                <span className={`font-retro text-xs ${catColor.text}`}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </span>
              </div>
            </div>
            <div>
              <label className="font-retro text-sm uppercase text-muted-foreground">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="mt-1 block w-full border-2 border-border bg-background px-3 py-2 font-retro text-sm focus:border-neon focus:outline-none"
              >
                {difficulties.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.value} - {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description - Markdown editor with preview */}
          <div>
            <div className="flex items-center justify-between">
              <label className="font-retro text-sm uppercase text-muted-foreground">
                Description <span className="text-destructive">*</span>
              </label>
              <div className="flex">
                <button
                  type="button"
                  onClick={() => setPreviewTab("edit")}
                  className={`border-2 border-border px-3 py-1 font-retro text-xs uppercase transition-colors ${
                    previewTab === "edit"
                      ? "bg-foreground text-background"
                      : "bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("preview")}
                  className={`border-2 border-l-0 border-border px-3 py-1 font-retro text-xs uppercase transition-colors ${
                    previewTab === "preview"
                      ? "bg-foreground text-background"
                      : "bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {previewTab === "edit" ? (
              <textarea
                required
                rows={12}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2 block w-full border-2 border-border bg-background px-3 py-2 font-mono text-sm focus:border-neon focus:outline-none"
                placeholder={`# 문제 설명

Markdown을 사용하여 문제를 설명하세요.

## 접속 정보
\`nc wargamebandit.is-a.dev {port}\`

## 힌트
* 기본적인 버퍼 오버플로우를 이해하고 있어야 합니다.`}
              />
            ) : (
              <div className="mt-2 min-h-[300px] border-2 border-border bg-background p-4">
                {description ? (
                  <MarkdownRenderer content={description} />
                ) : (
                  <p className="font-retro text-sm italic text-muted-foreground">
                    설명을 입력하면 미리보기가 표시됩니다.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Flag */}
          <div>
            <label className="font-retro text-sm uppercase text-muted-foreground">
              Flag <span className="text-destructive">*</span>
            </label>
            <div className="mt-1 flex gap-3">
              <div className="flex-1">
                <BrutalInput
                  required
                  value={flag}
                  onChange={(e) => setFlag(e.target.value)}
                  className={`font-mono text-sm ${
                    flag.length === 0
                      ? ""
                      : flagValid
                        ? "border-neon focus:shadow-brutal-neon"
                        : "border-destructive focus:shadow-[4px_4px_0px_0px_hsl(0_84%_60%)]"
                  }`}
                  placeholder="BNDT{y0ur_fl4g_h3r3}"
                />
                {flag.length > 0 && !flagValid && (
                  <p className="mt-1 font-retro text-xs text-destructive">
                    BNDT&#123;...&#125; 형식이어야 합니다.
                  </p>
                )}
                {flagValid && (
                  <p className="mt-1 font-retro text-xs text-neon">
                    올바른 플래그 형식입니다.
                  </p>
                )}
              </div>
              <select
                value={flagType}
                onChange={(e) => setFlagType(e.target.value)}
                className="border-2 border-border bg-background px-3 py-2 font-retro text-sm focus:border-neon focus:outline-none"
              >
                <option value="static">Static</option>
                <option value="regex">Regex</option>
              </select>
            </div>
          </div>

          {/* Hints - dynamic form */}
          <div>
            <div className="flex items-center justify-between">
              <label className="font-retro text-sm uppercase text-muted-foreground">
                Hints
              </label>
              <BrutalButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={addHint}
                className="border-2 border-border"
              >
                + Add Hint
              </BrutalButton>
            </div>

            {hints.length === 0 && (
              <p className="mt-2 font-retro text-xs text-muted-foreground">
                힌트를 추가하면 유저가 포인트를 소비하여 열람할 수 있습니다.
              </p>
            )}

            <div className="mt-2 space-y-3">
              {hints.map((hint, i) => (
                <div
                  key={i}
                  className="flex gap-3 border-2 border-border bg-muted/30 p-3"
                >
                  <div className="w-24 shrink-0">
                    <label className="font-retro text-xs text-muted-foreground">
                      Cost (pts)
                    </label>
                    <BrutalInput
                      type="number"
                      min={0}
                      max={500}
                      value={hint.cost}
                      onChange={(e) =>
                        updateHint(i, "cost", Number(e.target.value))
                      }
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="font-retro text-xs text-muted-foreground">
                      Content
                    </label>
                    <BrutalInput
                      value={hint.content}
                      onChange={(e) => updateHint(i, "content", e.target.value)}
                      className="mt-1 text-sm"
                      placeholder="힌트 내용을 입력하세요"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeHint(i)}
                    className="mt-5 shrink-0 font-retro text-muted-foreground transition-colors hover:text-destructive"
                    title="Remove hint"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="font-retro text-sm uppercase text-muted-foreground">
              Tags
            </label>
            <BrutalInput
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="mt-1 text-sm"
              placeholder="bof, stack, beginner (쉼표로 구분)"
            />
            {tags && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((tag) => (
                    <BrutalBadge key={tag} variant="muted">
                      {tag}
                    </BrutalBadge>
                  ))}
              </div>
            )}
          </div>

          {/* Author Notes */}
          <div>
            <label className="font-retro text-sm uppercase text-muted-foreground">
              Author Notes{" "}
              <span className="text-xs text-muted-foreground">(심사자에게만 공개)</span>
            </label>
            <textarea
              rows={3}
              value={authorNotes}
              onChange={(e) => setAuthorNotes(e.target.value)}
              className="mt-1 block w-full border-2 border-border bg-background px-3 py-2 font-mono text-sm focus:border-neon focus:outline-none"
              placeholder="풀이 방법, 출제 의도, 참고 사항 등을 적어주세요."
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <BrutalButton
              type="submit"
              variant="neon"
              disabled={loading || !flagValid}
              className="flex-1"
            >
              {loading ? "Submitting..." : "Submit for Review"}
            </BrutalButton>
            <BrutalButton
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
            >
              Cancel
            </BrutalButton>
          </div>
        </form>
      </BrutalCard>
    </div>
  );
}

export default SubmitChallenge;
