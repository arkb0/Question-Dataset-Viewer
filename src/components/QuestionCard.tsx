import {
  BookOpen,
  ChevronDown,
  CircleCheck,
  FileJson,
  StickyNote,
  Tag,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import type { FieldKey, FlatItem } from "../types";
import { prettifyLabel } from "../types";
import { RichText } from "../lib/richText";
import { Badge, BLOOMS_META, DIFFICULTY_META } from "./Badges";

function Section({
  icon: Icon,
  title,
  serif,
  note,
  children,
}: {
  icon: LucideIcon;
  title: string;
  serif?: boolean;
  note?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="mt-4 first:mt-3">
      <h3 className="section-title">
        <Icon size={13} aria-hidden="true" />
        {title}
      </h3>
      <div
        className={`rt${serif ? " rt-serif" : ""}${note ? " note-box" : ""}`}
      >
        {children}
      </div>
    </section>
  );
}

export function QuestionCard({
  item,
  fields,
  collapsed,
  onToggle,
  diffFilter,
  bloomsFilter,
  onFilterDiff,
  onFilterBlooms,
}: {
  item: FlatItem;
  fields: Record<FieldKey, boolean>;
  collapsed: boolean;
  onToggle: () => void;
  diffFilter: string;
  bloomsFilter: string;
  onFilterDiff: (v: string) => void;
  onFilterBlooms: (v: string) => void;
}) {
  const showSections =
    fields.question ||
    fields.ground_truth_answer ||
    (fields.authors_note && item.authors_note !== "");

  return (
    <article className="card p-5">
      {/* Card header: source file, index, question type */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip chip-src" title={item._source}>
          <FileJson size={12} aria-hidden="true" />
          <span className="max-w-56 truncate">{item._source}</span>
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          #{item._index + 1}
        </span>
        {fields.question_type && item.question_type !== "" && (
          <span className="badge chip-type">
            <Tag size={11} aria-hidden="true" />
            <span>{prettifyLabel(item.question_type)}</span>
          </span>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="btn-icon ml-auto h-7 w-7"
          title={collapsed ? "Expand item" : "Collapse item"}
          aria-expanded={!collapsed}
        >
          <ChevronDown
            size={15}
            className={collapsed ? "" : "rotate-180"}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Metadata badges */}
      {(fields.difficulty || fields.blooms_level) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {fields.difficulty && (
            <Badge
              meta={DIFFICULTY_META}
              value={item.difficulty}
              active={diffFilter === item.difficulty}
              onClick={() =>
                onFilterDiff(
                  diffFilter === item.difficulty ? "All" : item.difficulty,
                )
              }
            />
          )}
          {fields.blooms_level && (
            <Badge
              meta={BLOOMS_META}
              value={item.blooms_level}
              active={bloomsFilter === item.blooms_level}
              onClick={() =>
                onFilterBlooms(
                  bloomsFilter === item.blooms_level ? "All" : item.blooms_level,
                )
              }
            />
          )}
        </div>
      )}

      {/* Field sections */}
      {!collapsed && showSections && (
        <div>
          {fields.question && (
            <Section icon={BookOpen} title="Question" serif>
              <RichText text={item.question} />
            </Section>
          )}
          {fields.ground_truth_answer && (
            <Section icon={CircleCheck} title="Ground Truth Answer" serif>
              <RichText text={item.ground_truth_answer} />
            </Section>
          )}
          {fields.authors_note && item.authors_note !== "" && (
            <Section icon={StickyNote} title="Author's Note" note>
              <RichText text={item.authors_note} />
            </Section>
          )}
        </div>
      )}
    </article>
  );
}
