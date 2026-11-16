import { useMemo, type ReactNode } from "react";
import katex from "katex";

/* ------------------------------------------------------------------ */
/* Inline rendering: $math$, **bold**, *italic*, `code`                */
/* ------------------------------------------------------------------ */

function MathSpan({ tex, display }: { tex: string; display: boolean }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, {
        throwOnError: false,
        displayMode: display,
        strict: false,
      });
    } catch {
      return tex;
    }
  }, [tex, display]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function parseInline(text: string, baseKey: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re =
    /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|`[^`\n]+`|\*\*[\s\S]+?\*\*|\*[^*\n]+?\*)/g;
  let last = 0;
  let n = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${baseKey}-${n++}`;
    if (tok.startsWith("$$")) {
      out.push(<MathSpan key={key} tex={tok.slice(2, -2)} display />);
    } else if (tok.startsWith("$")) {
      out.push(<MathSpan key={key} tex={tok.slice(1, -1)} display={false} />);
    } else if (tok.startsWith("`")) {
      out.push(
        <code key={key}>{tok.slice(1, -1)}</code>,
      );
    } else if (tok.startsWith("**")) {
      out.push(<strong key={key}>{parseInline(tok.slice(2, -2), key)}</strong>);
    } else {
      out.push(<em key={key}>{parseInline(tok.slice(1, -1), key)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Inline content with literal newlines rendered as <br/>. */
function renderInlineText(text: string, baseKey: string): ReactNode[] {
  return text.split("\n").flatMap((seg, i) => {
    const nodes = parseInline(seg, `${baseKey}-${i}`);
    return i === 0 ? nodes : [<br key={`${baseKey}-br-${i}`} />, ...nodes];
  });
}

/* ------------------------------------------------------------------ */
/* Blocks: headings, display math, lists (nested), rules, paragraphs   */
/* ------------------------------------------------------------------ */

type ListLine = { indent: number; ordered: boolean; text: string };

type ListNode = { line: ListLine; children: ListNode[] };

function buildListTree(items: ListLine[]): ListNode[] {
  const roots: ListNode[] = [];
  const stack: ListNode[] = [];
  for (const line of items) {
    const node: ListNode = { line, children: [] };
    while (stack.length && stack[stack.length - 1].line.indent >= line.indent) {
      stack.pop();
    }
    if (stack.length) stack[stack.length - 1].children.push(node);
    else roots.push(node);
    stack.push(node);
  }
  return roots;
}

function renderListNodes(nodes: ListNode[], baseKey: string): ReactNode {
  const groups: { ordered: boolean; nodes: ListNode[] }[] = [];
  for (const n of nodes) {
    const g = groups[groups.length - 1];
    if (g && g.ordered === n.line.ordered) g.nodes.push(n);
    else groups.push({ ordered: n.line.ordered, nodes: [n] });
  }
  return (
    <>
      {groups.map((g, i) => {
        const Tag = g.ordered ? "ol" : "ul";
        return (
          <Tag key={`${baseKey}-${i}`}>
            {g.nodes.map((n, j) => (
              <li key={j}>
                {renderInlineText(n.line.text, `${baseKey}-${i}-${j}`)}
                {n.children.length > 0 &&
                  renderListNodes(n.children, `${baseKey}-${i}-${j}`)}
              </li>
            ))}
          </Tag>
        );
      })}
    </>
  );
}

function Para({ text }: { text: string }) {
  const trimmed = text.trim();
  const isSub = !text.includes("\n") && /^\*\*[\s\S]+\*\*$/.test(trimmed);
  const content = renderInlineText(text, "p");
  if (isSub) return <p className="rt-sub">{content}</p>;
  return <p>{content}</p>;
}

function parseBlocks(text: string): ReactNode[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      i++;
      continue;
    }

    // Headings (# .. ####)
    const h = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (h) {
      const level = h[1].length;
      const Tag = (level <= 3 ? "h3" : "h4") as "h3" | "h4";
      nodes.push(<Tag key={k++}>{parseInline(h[2], `h${k}`)}</Tag>);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      nodes.push(<hr key={k++} />);
      i++;
      continue;
    }

    // Display math block ($$ ... $$, possibly spanning lines)
    if (trimmed.startsWith("$$")) {
      let tex = trimmed.slice(2);
      if (tex.endsWith("$$") && tex.length >= 2) {
        tex = tex.slice(0, -2);
        i++;
      } else {
        i++;
        const parts: string[] = [tex];
        while (i < lines.length) {
          const l = lines[i];
          parts.push(l);
          i++;
          if (l.trim().endsWith("$$")) break;
        }
        tex = parts.join("\n");
        if (tex.endsWith("$$")) tex = tex.slice(0, -2);
      }
      nodes.push(
        <div key={k++}>
          <MathSpan tex={tex} display />
        </div>,
      );
      continue;
    }

    // Lists (ordered or unordered, with nesting and indented continuations)
    if (/^\s*([-*]|\d+[.)])\s+/.test(line)) {
      const items: ListLine[] = [];
      while (i < lines.length) {
        const raw = lines[i];
        const m = /^(\s*)([-*]|\d+[.)])\s+(.*)$/.exec(raw);
        if (m) {
          const indent = m[1].replace(/\t/g, "  ").length;
          items.push({
            indent,
            ordered: /\d/.test(m[2][0]),
            text: m[3],
          });
          i++;
          continue;
        }
        // Indented, non-marker line: continuation of the previous item
        const t = raw.trim();
        if (
          items.length > 0 &&
          /^\s+/.test(raw) &&
          t !== "" &&
          !/^(#{1,4})\s+/.test(t) &&
          !/^(-{3,}|\*{3,}|_{3,})$/.test(t)
        ) {
          items[items.length - 1].text += `\n${t}`;
          i++;
          continue;
        }
        break;
      }
      nodes.push(
        <div key={k++}>{renderListNodes(buildListTree(items), `l${k}`)}</div>,
      );
      continue;
    }

    // Paragraph — accumulate until a blank or structural line
    const para: string[] = [];
    while (i < lines.length) {
      const l = lines[i];
      const t = l.trim();
      if (t === "") break;
      if (/^(#{1,4})\s+/.test(t)) break;
      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(l)) break;
      if (t.startsWith("$$")) break;
      if (/^\s*([-*]|\d+[.)])\s+/.test(l)) break;
      para.push(l);
      i++;
    }
    nodes.push(<Para key={k++} text={para.join("\n")} />);
  }

  return nodes;
}

/** Render dataset field text: newlines, markdown-ish formatting and LaTeX. */
export function RichText({ text }: { text: string }) {
  const content = useMemo(() => parseBlocks(text), [text]);
  return <>{content}</>;
}
