// 붙여 넣은 글을 간단한 마크다운 규칙(#, ##, ###, -, **굵게**, 빈 줄 문단)으로 보여줘요.
function inline(t: string) {
  return t.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong> : p,
  );
}

export function GuideBody({ body }: { body: string }) {
  // 소제목(#, ##, ###) 줄은 빈 줄이 없어도 앞뒤를 끊어 단독 블록으로 만들어요.
  const blocks = body
    .replace(/\r/g, "")
    .replace(/^[ \t]*(#{1,3} .+)$/gm, "\n\n$1\n\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  return (
    <div className="space-y-5 text-[17px] leading-[1.8] text-foreground/85">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        const cells = (l: string) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        if (lines.length >= 2 && lines.every((l) => l.trim().startsWith("|")) && /^\s*\|?\s*:?-{2,}/.test(lines[1] ?? "")) {
          const head = cells(lines[0] ?? "");
          const rows = lines.slice(2).map(cells);
          return (
            <div key={i} className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full border-collapse text-[15px] leading-relaxed">
                <thead className="bg-accent/50">
                  <tr>{head.map((c, j) => <th key={j} className="border-b border-border px-3 py-2 text-left font-semibold text-foreground">{inline(c)}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.map((r, k) => (
                    <tr key={k} className="border-b border-border last:border-0">
                      {r.map((c, j) => <td key={j} className="px-3 py-2 align-top">{inline(c)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        const img = b.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
        if (img && /^(https:\/\/|\/api\/public\/guide-image\/)/.test(img[2] ?? ""))
          return (
            <figure key={i} className="my-2">
              <img src={img[2]} alt={img[1]} loading="lazy" className="w-full rounded-2xl" />
              {img[1] && <figcaption className="mt-2 text-center text-sm">{img[1]}</figcaption>}
            </figure>
          );
        if (lines.every((l) => /^[-*] /.test(l)))
          return <ul key={i} className="list-disc space-y-2 pl-6">{lines.map((l, j) => <li key={j}>{inline(l.slice(2))}</li>)}</ul>;
        const h = b.match(/^(#{1,3}) (.+)$/);
        if (h && lines.length === 1) {
          const cls = "font-serif font-bold text-foreground leading-snug";
          return (h[1] ?? "").length <= 2
            ? <h2 key={i} className={`${cls} pt-4 text-[23px]`}>{h[2]}</h2>
            : <h3 key={i} className={`${cls} pt-2 text-[20px]`}>{h[2]}</h3>;
        }
        return <p key={i}>{lines.map((l, j) => <span key={j}>{j > 0 && <br />}{inline(l)}</span>)}</p>;
      })}
    </div>
  );
}
