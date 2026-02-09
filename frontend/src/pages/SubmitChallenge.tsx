import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import MarkdownRenderer from "../components/common/MarkdownRenderer";
import { submitChallenge } from "../services/community";
import { getCategoryColor } from "../utils/categoryColors";

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
      <h1 className="text-2xl font-bold">Submit Challenge</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        커뮤니티 챌린지를 제출하세요. 관리자 심사 후 공개됩니다.
      </p>

      {error && (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="문제 제목"
          />
        </div>

        {/* Category + Difficulty */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className={`inline-block h-2 w-2 rounded-full ${catColor.bg}`}
              />
              <span className={`text-xs ${catColor.text}`}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
            <label className="block text-sm font-medium">
              Description <span className="text-destructive">*</span>
            </label>
            <div className="flex rounded-md border border-input">
              <button
                type="button"
                onClick={() => setPreviewTab("edit")}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  previewTab === "edit"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("preview")}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  previewTab === "preview"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
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
              className="mt-2 block w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder={`# 문제 설명

Markdown을 사용하여 문제를 설명하세요.

## 접속 정보
\`nc wargamebandit.is-a.dev {port}\`

## 힌트
* 기본적인 버퍼 오버플로우를 이해하고 있어야 합니다.`}
            />
          ) : (
            <div className="mt-2 min-h-[300px] rounded-md border border-input bg-background p-4">
              {description ? (
                <MarkdownRenderer content={description} />
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  설명을 입력하면 미리보기가 표시됩니다.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Flag */}
        <div>
          <label className="block text-sm font-medium">
            Flag <span className="text-destructive">*</span>
          </label>
          <div className="mt-1 flex gap-3">
            <div className="flex-1">
              <input
                required
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                className={`block w-full rounded-md border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-1 ${
                  flag.length === 0
                    ? "border-input focus:border-primary focus:ring-primary"
                    : flagValid
                      ? "border-green-500/50 focus:border-green-500 focus:ring-green-500"
                      : "border-destructive/50 focus:border-destructive focus:ring-destructive"
                } bg-background`}
                placeholder="BNDT{y0ur_fl4g_h3r3}"
              />
              {flag.length > 0 && !flagValid && (
                <p className="mt-1 text-xs text-destructive">
                  BNDT&#123;...&#125; 형식이어야 합니다.
                </p>
              )}
              {flagValid && (
                <p className="mt-1 text-xs text-green-500">
                  올바른 플래그 형식입니다.
                </p>
              )}
            </div>
            <select
              value={flagType}
              onChange={(e) => setFlagType(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="static">Static</option>
              <option value="regex">Regex</option>
            </select>
          </div>
        </div>

        {/* Hints - dynamic form */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">Hints</label>
            <button
              type="button"
              onClick={addHint}
              className="rounded-md border border-input px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              + Add Hint
            </button>
          </div>

          {hints.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              힌트를 추가하면 유저가 포인트를 소비하여 열람할 수 있습니다.
            </p>
          )}

          <div className="mt-2 space-y-3">
            {hints.map((hint, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-md border border-input bg-muted/30 p-3"
              >
                <div className="w-24 shrink-0">
                  <label className="text-xs text-muted-foreground">
                    Cost (pts)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={hint.cost}
                    onChange={(e) =>
                      updateHint(i, "cost", Number(e.target.value))
                    }
                    className="mt-1 block w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">
                    Content
                  </label>
                  <input
                    value={hint.content}
                    onChange={(e) => updateHint(i, "content", e.target.value)}
                    className="mt-1 block w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                    placeholder="힌트 내용을 입력하세요"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeHint(i)}
                  className="mt-5 shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                  title="Remove hint"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium">Tags</label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="bof, stack, beginner (쉼표로 구분)"
          />
          {tags && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
                .map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                  >
                    {tag}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Author Notes */}
        <div>
          <label className="block text-sm font-medium">
            Author Notes{" "}
            <span className="text-xs text-muted-foreground">(심사자에게만 공개)</span>
          </label>
          <textarea
            rows={3}
            value={authorNotes}
            onChange={(e) => setAuthorNotes(e.target.value)}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="풀이 방법, 출제 의도, 참고 사항 등을 적어주세요."
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !flagValid}
            className="flex-1 rounded-md bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit for Review"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-md border border-input px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/10"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default SubmitChallenge;
