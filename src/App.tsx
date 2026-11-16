import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileJson,
  Library,
  Moon,
  Search,
  SlidersHorizontal,
  Sun,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import type { Dataset, FieldKey, FlatItem } from "./types";
import { BLOOMS_LEVELS, DIFFICULTIES, FIELDS } from "./types";
import { ingestDataset } from "./lib/dataset";
import { Legend } from "./components/Legend";
import { QuestionCard } from "./components/QuestionCard";
import sampleLuna from "./samples/cct_aig_gpt_5.6_luna.json";
import sampleGemini from "./samples/cct_aig_gemini_4_argon_high.json";
import sampleClaude from "./samples/cct_aig_claude_sonnet_5.5_high.json";

const SAMPLE_DATASETS = [
  { name: "cct_aig_gpt_5.6_luna.json", data: sampleLuna },
  { name: "cct_aig_gemini_4_argon_high.json", data: sampleGemini },
  { name: "cct_aig_claude_sonnet_5.5_high.json", data: sampleClaude },
];

const ALL_FIELDS: Record<FieldKey, boolean> = {
  question: true,
  ground_truth_answer: true,
  authors_note: true,
  blooms_level: true,
  difficulty: true,
  question_type: true,
};

type Theme = "light" | "dark";

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem("qdv-theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch {
      /* storage unavailable */
    }
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    try {
      localStorage.setItem("qdv-theme", theme);
    } catch {
      /* storage unavailable */
    }
  }, [theme]);

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [fields, setFields] = useState<Record<FieldKey, boolean>>(ALL_FIELDS);
  const [diffFilter, setDiffFilter] = useState("All");
  const [bloomsFilter, setBloomsFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mergeDatasets = (next: Dataset[]) => {
    if (next.length === 0) return;
    setDatasets((prev) => {
      const names = new Set(next.map((d) => d.name));
      return [...prev.filter((d) => !names.has(d.name)), ...next];
    });
  };

  const loadFiles = async (files: FileList | File[]) => {
    const next: Dataset[] = [];
    const errs: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const text = await file.text();
        let data: unknown;
        try {
          data = JSON.parse(text);
        } catch {
          errs.push(`${file.name}: not valid JSON.`);
          continue;
        }
        const r = ingestDataset(file.name, data);
        if (r.dataset) next.push(r.dataset);
        errs.push(...r.errors);
      } catch {
        errs.push(`${file.name}: could not be read.`);
      }
    }
    mergeDatasets(next);
    if (errs.length) setErrors((prev) => [...prev, ...errs]);
  };

  const loadSamples = () => {
    const next: Dataset[] = [];
    const errs: string[] = [];
    for (const s of SAMPLE_DATASETS) {
      const r = ingestDataset(s.name, s.data);
      if (r.dataset) next.push(r.dataset);
      errs.push(...r.errors);
    }
    mergeDatasets(next);
    if (errs.length) setErrors((prev) => [...prev, ...errs]);
  };

  const flatItems = useMemo<FlatItem[]>(
    () =>
      datasets.flatMap((d) =>
        d.items.map((it, i) => ({
          ...it,
          _id: `${d.id}:${i}`,
          _source: d.name,
          _index: i,
        })),
      ),
    [datasets],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return flatItems.filter(
      (it) =>
        (diffFilter === "All" || it.difficulty === diffFilter) &&
        (bloomsFilter === "All" || it.blooms_level === bloomsFilter) &&
        (!q ||
          [
            it.question,
            it.ground_truth_answer,
            it.authors_note,
            it.question_type,
            it._source,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q)),
    );
  }, [flatItems, diffFilter, bloomsFilter, query]);

  const toggleCollapsed = (id: string) =>
    setCollapsed((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const filtersActive =
    diffFilter !== "All" || bloomsFilter !== "All" || query.trim() !== "";
  const clearFilters = () => {
    setDiffFilter("All");
    setBloomsFilter("All");
    setQuery("");
  };

  const hasFiles = datasets.length > 0;

  return (
    <div
      data-theme={theme}
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors"
      onDragEnter={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setDragOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) void loadFiles(e.dataTransfer.files);
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)]">
            <Library size={16} aria-hidden="true" />
          </span>
          <h1 className="text-sm font-semibold tracking-tight">
            Question Dataset Viewer
          </h1>
          {hasFiles && (
            <span className="text-xs text-[var(--text-muted)]">
              {flatItems.length} items · {datasets.length}{" "}
              {datasets.length === 1 ? "file" : "files"}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="btn-ghost"
              onClick={loadSamples}
              title="Load the three bundled example datasets"
            >
              Examples
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} aria-hidden="true" /> Open JSON
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={() =>
                setTheme((t) => (t === "dark" ? "light" : "dark"))
              }
              title="Toggle light / dark theme"
            >
              {theme === "dark" ? (
                <Sun size={16} aria-hidden="true" />
              ) : (
                <Moon size={16} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Loaded files + filters */}
        {hasFiles && (
          <div className="border-t border-[var(--border)] bg-[var(--surface)]">
            <div className="mx-auto max-w-5xl space-y-2.5 px-4 py-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {datasets.map((d) => (
                  <span key={d.id} className="chip chip-src">
                    <FileJson size={12} aria-hidden="true" />
                    <span className="max-w-44 truncate" title={d.name}>
                      {d.name}
                    </span>
                    <span className="text-[0.68rem] opacity-75">
                      {d.items.length}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDatasets((prev) =>
                          prev.filter((x) => x.id !== d.id),
                        )
                      }
                      className="rounded-full p-0.5 hover:bg-[var(--surface-2)]"
                      title={`Remove ${d.name}`}
                    >
                      <X size={11} aria-hidden="true" />
                    </button>
                  </span>
                ))}
                <span className="ml-auto text-xs text-[var(--text-muted)]">
                  {flatItems.length} items
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    aria-hidden="true"
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search items…"
                    className="h-8 w-48 rounded-md border border-[var(--border)] bg-[var(--surface)] pl-8 pr-2 text-sm placeholder:text-[var(--text-muted)] sm:w-56"
                  />
                </div>

                <label className="sr-only" htmlFor="diff-filter">
                  Filter by difficulty
                </label>
                <select
                  id="diff-filter"
                  value={diffFilter}
                  onChange={(e) => setDiffFilter(e.target.value)}
                  className="select"
                >
                  <option value="All">Difficulty: All</option>
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <label className="sr-only" htmlFor="blooms-filter">
                  Filter by Bloom&rsquo;s level
                </label>
                <select
                  id="blooms-filter"
                  value={bloomsFilter}
                  onChange={(e) => setBloomsFilter(e.target.value)}
                  className="select"
                >
                  <option value="All">Bloom&rsquo;s: All</option>
                  {BLOOMS_LEVELS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>

                <details className="relative">
                  <summary className="btn-ghost list-none">
                    <SlidersHorizontal size={14} aria-hidden="true" />
                    Fields
                  </summary>
                  <div className="absolute right-0 z-20 mt-1 w-60 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg">
                    {FIELDS.map((f) => (
                      <label
                        key={f.key}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[var(--surface-2)]"
                      >
                        <input
                          type="checkbox"
                          checked={fields[f.key]}
                          onChange={() =>
                            setFields((prev) => ({
                              ...prev,
                              [f.key]: !prev[f.key],
                            }))
                          }
                          className="h-3.5 w-3.5"
                          style={{ accentColor: "var(--accent)" }}
                        />
                        {f.label}
                      </label>
                    ))}
                  </div>
                </details>

                {filtersActive && (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </button>
                )}

                <span className="ml-auto text-xs text-[var(--text-muted)]">
                  Showing {filtered.length} of {flatItems.length}
                </span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 py-5">
        {errors.length > 0 && (
          <div
            className="mb-4 rounded-lg border px-4 py-3 text-sm"
            style={{
              background: "var(--error-bg)",
              borderColor: "var(--error-border)",
              color: "var(--error-fg)",
            }}
          >
            <div className="flex items-center gap-2">
              <TriangleAlert size={15} aria-hidden="true" />
              <span className="font-semibold">
                Some files could not be loaded
              </span>
              <button
                type="button"
                onClick={() => setErrors([])}
                className="ml-auto rounded p-1 hover:opacity-70"
                title="Dismiss"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-6">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {!hasFiles ? (
          <div className="mt-8 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <Library size={20} aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-base font-semibold">
              Load question datasets
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-[var(--text-muted)]">
              Open one or more JSON files conforming to the question dataset
              schema. Required fields: question, ground_truth_answer,
              blooms_level, difficulty. Files are parsed locally in your
              browser.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                type="button"
                className="btn-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} aria-hidden="true" /> Open JSON files
              </button>
              <button type="button" className="btn-ghost" onClick={loadSamples}>
                Load example datasets
              </button>
            </div>
            <p className="mt-4 text-xs text-[var(--text-muted)]">
              Drag and drop JSON files anywhere on this page, or click
              &ldquo;Load example datasets&rdquo; to try the three bundled
              examples.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Legend
              diffFilter={diffFilter}
              bloomsFilter={bloomsFilter}
              onToggleDiff={setDiffFilter}
              onToggleBlooms={setBloomsFilter}
            />

            {filtered.length === 0 ? (
              <div className="card px-6 py-10 text-center">
                <p className="text-sm text-[var(--text-muted)]">
                  No items match the current filters.
                </p>
                <button
                  type="button"
                  className="btn-ghost mt-3"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              filtered.map((item) => (
                <QuestionCard
                  key={item._id}
                  item={item}
                  fields={fields}
                  collapsed={collapsed.has(item._id)}
                  onToggle={() => toggleCollapsed(item._id)}
                  diffFilter={diffFilter}
                  bloomsFilter={bloomsFilter}
                  onFilterDiff={setDiffFilter}
                  onFilterBlooms={setBloomsFilter}
                />
              ))
            )}
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-8 text-xs text-[var(--text-muted)]">
        Files are parsed locally in your browser — nothing is uploaded.
      </footer>

      {/* Drag-and-drop overlay */}
      {dragOver && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg)]/85 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[var(--accent)] bg-[var(--surface)] px-10 py-8">
            <Upload size={22} className="text-[var(--accent)]" aria-hidden="true" />
            <p className="text-sm font-semibold">Drop JSON files to load</p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void loadFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
