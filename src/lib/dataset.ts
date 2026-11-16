import type { Dataset, Question } from "../types";

const REQUIRED = [
  "question",
  "ground_truth_answer",
  "blooms_level",
  "difficulty",
];

let counter = 0;

/**
 * Validate parsed JSON against the question dataset schema and build a
 * Dataset. Items missing required fields are skipped (and reported); a
 * file with no usable items yields only an error.
 */
export function ingestDataset(
  name: string,
  data: unknown,
): { dataset?: Dataset; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(data)) {
    errors.push(`${name}: expected a top-level JSON array.`);
    return { errors };
  }

  const items: Question[] = [];
  let skipped = 0;

  for (const raw of data) {
    const rec =
      raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
    if (
      rec &&
      REQUIRED.every(
        (k) => typeof rec[k] === "string" && (rec[k] as string).trim() !== "",
      )
    ) {
      items.push({
        question: rec.question as string,
        ground_truth_answer: rec.ground_truth_answer as string,
        blooms_level: rec.blooms_level as string,
        difficulty: rec.difficulty as string,
        question_type:
          typeof rec.question_type === "string" ? rec.question_type : "",
        authors_note:
          typeof rec.authors_note === "string" ? rec.authors_note : "",
      });
    } else {
      skipped++;
    }
  }

  if (skipped > 0) {
    errors.push(
      `${name}: skipped ${skipped} item${skipped === 1 ? "" : "s"} missing required fields.`,
    );
  }
  if (items.length === 0) {
    errors.push(`${name}: no valid question items found.`);
    return { errors };
  }

  return {
    dataset: { id: `ds-${Date.now()}-${counter++}`, name, items },
    errors,
  };
}
