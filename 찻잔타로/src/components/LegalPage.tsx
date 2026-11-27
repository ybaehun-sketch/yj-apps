import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export type Section = { title: string; body: ReactNode };

export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: Section[] }) {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← 찻잔 타로로 돌아가기</Link>
      <h1 className="mt-4 font-serif text-3xl font-bold">{title}</h1>
      <p className="mt-1 text-xs text-muted-foreground">시행일 {updated}</p>
      <div className="mt-8 space-y-7 rounded-3xl border bg-card p-6 text-sm leading-relaxed shadow-warm">
        {sections.map((s, i) => (
          <section key={s.title}>
            <h2 className="mb-2 font-serif text-base font-bold">제{i + 1}조 {s.title}</h2>
            <div className="space-y-1.5 text-muted-foreground">{s.body}</div>
          </section>
        ))}
      </div>
    </main>
  );
}

export function LegalLinks() {
  return (
    <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
      <Link to="/about" className="underline-offset-2 hover:underline">서비스 소개</Link>
      <span aria-hidden>·</span>
      <Link to="/guide" className="underline-offset-2 hover:underline">마음 찻집 이야기</Link>
      <span aria-hidden>·</span>
      <Link to="/contact" className="underline-offset-2 hover:underline">문의하기</Link>
      <span aria-hidden>·</span>
      <Link to="/terms" className="underline-offset-2 hover:underline">이용약관</Link>
      <span aria-hidden>·</span>
      <Link to="/privacy" className="font-semibold underline-offset-2 hover:underline">개인정보처리방침</Link>
    </p>
  );
}
