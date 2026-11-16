import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Flame,
  Gauge,
  Leaf,
  Lightbulb,
  Microscope,
  Scale,
  Sparkles,
  Tag,
  Wrench,
} from "lucide-react";
import { prettifyLabel } from "../types";

export type BadgeMeta = Record<
  string,
  { label: string; icon: LucideIcon; cls: string }
>;

export const DIFFICULTY_META: BadgeMeta = {
  Easy: { label: "Easy", icon: Leaf, cls: "bd-easy" },
  Medium: { label: "Medium", icon: Gauge, cls: "bd-medium" },
  Hard: { label: "Hard", icon: Flame, cls: "bd-hard" },
};

export const BLOOMS_META: BadgeMeta = {
  Remember: { label: "Remember", icon: BookOpen, cls: "bl-remember" },
  Understand: { label: "Understand", icon: Lightbulb, cls: "bl-understand" },
  Apply: { label: "Apply", icon: Wrench, cls: "bl-apply" },
  Analyse: { label: "Analyse", icon: Microscope, cls: "bl-analyse" },
  Evaluate: { label: "Evaluate", icon: Scale, cls: "bl-evaluate" },
  Create: { label: "Create", icon: Sparkles, cls: "bl-create" },
};

export function Badge({
  value,
  meta,
  onClick,
  active,
}: {
  value: string;
  meta: BadgeMeta;
  onClick?: () => void;
  active?: boolean;
}) {
  const m = meta[value] ?? {
    label: prettifyLabel(value),
    icon: Tag,
    cls: "bd-other",
  };
  const Icon = m.icon;
  const cls = `badge ${m.cls}${onClick ? " badge-btn" : ""}${
    active ? " legend-active" : ""
  }`;
  const inner = (
    <>
      <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      <span>{m.label}</span>
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        className={cls}
        onClick={onClick}
        aria-pressed={active}
        title={`Filter by ${m.label}`}
      >
        {inner}
      </button>
    );
  }
  return <span className={cls}>{inner}</span>;
}
