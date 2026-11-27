import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="relative z-10 mx-auto mt-16 max-w-2xl border-t border-border/50 px-4 pb-12 pt-6 text-center text-xs text-muted-foreground">
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        <Link to="/about" className="underline-offset-4 hover:text-foreground hover:underline">
          서비스 소개
        </Link>
        <Link to="/guide" className="underline-offset-4 hover:text-foreground hover:underline">
          꿈해몽 사전
        </Link>
        <Link to="/contact" className="underline-offset-4 hover:text-foreground hover:underline">
          문의하기
        </Link>
        <Link to="/terms" className="underline-offset-4 hover:text-foreground hover:underline">
          이용약관
        </Link>
        <Link to="/privacy" className="font-semibold underline-offset-4 hover:text-foreground hover:underline">
          개인정보처리방침
        </Link>
      </div>
      <p className="mt-3 opacity-80">본 서비스의 AI 꿈풀이와 부적·행운 번호는 재미와 성찰을 위한 참고용이며 의학·심리·투자 조언이 아닙니다.</p>
      <p className="mt-1.5 opacity-70">
        © 2026 와이제이 스튜디오 (YJ Studio). All rights reserved. ·{" "}
        <a href="mailto:contact@yjstudio.app" className="underline-offset-2 hover:underline">
          contact@yjstudio.app
        </a>
      </p>
    </footer>
  );
}
