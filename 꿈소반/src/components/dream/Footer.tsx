export function Footer() {
  return (
    <footer className="relative z-10 mt-16 pb-12 text-center text-sm text-muted-foreground">
      <div className="flex justify-center gap-4">
        <a
          href="https://yjstudio.app/dreamsoban/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:underline"
        >
          이용약관
        </a>
        <a
          href="https://yjstudio.app/dreamsoban/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:underline"
        >
          개인정보처리방침
        </a>
        <a href="/admin" className="opacity-60 underline-offset-4 hover:underline hover:opacity-100">관리자 전용</a>
      </div>
      <p className="mt-3 opacity-70">© 2026 와이제이 스튜디오. All rights reserved.</p>
    </footer>
  );
}

export function BottomAd() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-[100px] max-w-3xl items-center justify-center px-3">
        <div className="flex h-[84px] w-full items-center justify-center rounded-lg border border-dashed border-border text-[11px] tracking-widest text-muted-foreground">
          ADVERTISEMENT · 광고 영역 (AdSense)
        </div>
      </div>
    </div>
  );
}
