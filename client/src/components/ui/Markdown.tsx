import { Fragment, type ReactNode } from 'react';

/** Renders inline **bold**, *italic* / _italic_ and `code` as React nodes (no HTML injection). */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${keyBase}-${i++}`;
    if (tok.startsWith('**')) out.push(<strong key={k} className="font-semibold text-white">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('`')) out.push(<code key={k} className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.85em]">{tok.slice(1, -1)}</code>);
    else out.push(<em key={k} className="text-slate-300">{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** A small Markdown subset for PathGPT answers: paragraphs, lists, block quotes and inline emphasis. */
export function Markdown({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-300">
      {blocks.map((block, bi) => {
        const lines = block.split('\n');
        if (lines.every((l) => /^\s*(\d+\.|[-*•])\s+/.test(l) || /^\s{2,}\S/.test(l))) {
          const ordered = /^\s*\d+\./.test(lines[0]);
          const items: string[][] = [];
          for (const l of lines) {
            if (/^\s*(\d+\.|[-*•])\s+/.test(l)) items.push([l.replace(/^\s*(\d+\.|[-*•])\s+/, '')]);
            else items[items.length - 1]?.push(l.trim());
          }
          const List = ordered ? 'ol' : 'ul';
          return (
            <List key={bi} className={ordered ? 'list-decimal space-y-2 pl-5 marker:text-cyan-400' : 'list-disc space-y-1.5 pl-5 marker:text-cyan-400'}>
              {items.map((parts, ii) => (
                <li key={ii}>
                  {parts.map((p, pi) => (
                    <Fragment key={pi}>
                      {pi > 0 && <br />}
                      {pi > 0 ? <span className="text-slate-400">{inline(p, `${bi}-${ii}-${pi}`)}</span> : inline(p, `${bi}-${ii}-${pi}`)}
                    </Fragment>
                  ))}
                </li>
              ))}
            </List>
          );
        }
        if (lines.every((l) => l.startsWith('>'))) {
          return (
            <blockquote key={bi} className="border-l-2 border-cyan-400/50 bg-cyan-400/[0.04] py-1.5 pl-3 text-slate-300">
              {inline(lines.map((l) => l.replace(/^>\s?/, '')).join(' '), `${bi}`)}
            </blockquote>
          );
        }
        return (
          <p key={bi}>
            {lines.map((l, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {inline(l, `${bi}-${li}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
