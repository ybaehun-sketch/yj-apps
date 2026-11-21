import { Link } from "@tanstack/react-router";

export function LegalFooter() {
  return (
    <footer className="mx-auto mt-12 flex max-w-xl flex-col items-center gap-2 pb-10 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center justify-center gap-4">
        <a
          href="https://yjstudio.app/bambooforest/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          이용약관
        </a>
        <span aria-hidden>·</span>
        <a
          href="https://yjstudio.app/bambooforest/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          개인정보처리방침
        </a>
        <span aria-hidden>·</span>
        <Link to="/admin" className="underline-offset-2 hover:underline">
          관리자
        </Link>
      </div>
      <p>© 2026 와이제이 스튜디오 (YJ Studio). All rights reserved. · ceo@yjstudio.app</p>
    </footer>
  );
}
