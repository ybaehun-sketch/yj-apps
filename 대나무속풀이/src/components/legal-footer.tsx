import { Link } from "@tanstack/react-router";

export function LegalFooter() {
  return (
    <footer className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-2 border-t border-border/50 px-5 pb-10 pt-6 text-center text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link to="/about" className="underline-offset-4 hover:text-foreground hover:underline">
          서비스 소개
        </Link>
        <span aria-hidden>·</span>
        <Link to="/story" className="underline-offset-4 hover:text-foreground hover:underline">
          속풀이 칼럼
        </Link>
        <span aria-hidden>·</span>
        <Link to="/contact" className="underline-offset-4 hover:text-foreground hover:underline">
          문의하기
        </Link>
        <span aria-hidden>·</span>
        <Link to="/terms" className="underline-offset-4 hover:text-foreground hover:underline">
          이용약관
        </Link>
        <span aria-hidden>·</span>
        <Link to="/privacy" className="font-semibold underline-offset-4 hover:text-foreground hover:underline">
          개인정보처리방침
        </Link>
      </div>
      <p>본 서비스의 AI 응답은 감정 해소를 돕기 위한 참고용이며 의학·심리·법률 상담을 대신하지 않습니다.</p>
      <p>
        © 2026 와이제이 스튜디오 (YJ Studio). All rights reserved. ·{" "}
        <a href="mailto:contact@yjstudio.app" className="underline-offset-2 hover:underline">
          contact@yjstudio.app
        </a>
      </p>
    </footer>
  );
}
