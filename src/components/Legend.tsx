import { Info } from "lucide-react";
import { BLOOMS_LEVELS, DIFFICULTIES } from "../types";
import { Badge, BLOOMS_META, DIFFICULTY_META } from "./Badges";

export function Legend({
  diffFilter,
  bloomsFilter,
  onToggleDiff,
  onToggleBlooms,
}: {
  diffFilter: string;
  bloomsFilter: string;
  onToggleDiff: (v: string) => void;
  onToggleBlooms: (v: string) => void;
}) {
  return (
    <section className="card p-4" aria-label="Legend">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Info size={14} className="text-[var(--text-muted)]" aria-hidden="true" />
        <h2 className="text-sm font-semibold">Legend</h2>
        <p className="text-xs text-[var(--text-muted)]">
          Colour is paired with an icon on every badge. Click a chip to filter;
          click again to clear.
        </p>
      </div>
      <div className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        <div>
          <h3 className="legend-group">Difficulty</h3>
          <div className="flex flex-wrap gap-1.5">
            {DIFFICULTIES.map((d) => (
              <Badge
                key={d}
                meta={DIFFICULTY_META}
                value={d}
                active={diffFilter === d}
                onClick={() => onToggleDiff(diffFilter === d ? "All" : d)}
              />
            ))}
          </div>
        </div>
        <div>
          <h3 className="legend-group">Bloom&rsquo;s Level</h3>
          <div className="flex flex-wrap gap-1.5">
            {BLOOMS_LEVELS.map((b) => (
              <Badge
                key={b}
                meta={BLOOMS_META}
                value={b}
                active={bloomsFilter === b}
                onClick={() => onToggleBlooms(bloomsFilter === b ? "All" : b)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
