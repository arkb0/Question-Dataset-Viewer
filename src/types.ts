export interface Question {
  question_type: string;
  question: string;
  ground_truth_answer: string;
  authors_note: string;
  blooms_level: string;
  difficulty: string;
}

export type FieldKey =
  | "question"
  | "ground_truth_answer"
  | "authors_note"
  | "blooms_level"
  | "difficulty"
  | "question_type";

export const FIELDS: { key: FieldKey; label: string }[] = [
  { key: "question", label: "Question" },
  { key: "ground_truth_answer", label: "Ground Truth Answer" },
  { key: "authors_note", label: "Author's Note" },
  { key: "blooms_level", label: "Bloom's Level" },
  { key: "difficulty", label: "Difficulty" },
  { key: "question_type", label: "Question Type" },
];

export const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;

export const BLOOMS_LEVELS = [
  "Remember",
  "Understand",
  "Apply",
  "Analyse",
  "Evaluate",
  "Create",
] as const;

export interface Dataset {
  id: string;
  name: string;
  items: Question[];
}

export interface FlatItem extends Question {
  _id: string;
  _source: string;
  _index: number;
}

/** "short_answer" -> "Short Answer", "proof_sketch" -> "Proof Sketch" */
export function prettifyLabel(s: string): string {
  return s
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
