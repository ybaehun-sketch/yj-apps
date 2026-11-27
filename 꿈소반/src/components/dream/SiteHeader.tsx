import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const item = "rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-background/40 hover:text-foreground";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/60 backdrop-blur-md">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2.5">
        <Link to="/" className="font-serif text-lg text-foreground">🌙 꿈소반</Link>
        <div className="flex items-center gap-1">
          <Link to="/" className={item} activeProps={{ className: `${item} text-foreground` }} activeOptions={{ exact: true }}>홈</Link>
          <Link to="/about" className={item} activeProps={{ className: `${item} text-foreground` }}>소개</Link>
          <Link to="/guide" className={item} activeProps={{ className: `${item} text-foreground` }}>꿈해몽 칼럼</Link>
          <Dialog>
            <DialogTrigger className={item}>이용방법</DialogTrigger>
            <DialogContent className="glass max-h-[80vh] overflow-y-auto text-foreground">
              <DialogHeader><DialogTitle className="font-serif">꿈소반 이용방법</DialogTitle></DialogHeader>
              <ol className="space-y-3 text-base leading-relaxed text-muted-foreground">
                <li><b className="text-foreground">1. 꿈 적기</b> — 기억나는 장면, 사람, 색깔, 감정을 편하게 적어 주세요. 뒤죽박죽이어도 괜찮아요.</li>
                <li><b className="text-foreground">2. 꿈풀이 받기</b> — 전통 해몽과 현대 심리학 두 시선으로 꿈의 핵심 상징을 풀어 드려요.</li>
                <li><b className="text-foreground">3. 부적 또는 행운 복권</b> — 꿈의 기운에 따라 내 꿈 맞춤 액막이 부적이나 행운 번호를 받아요. 저장해서 친구에게 공유해 보세요.</li>
                <li><b className="text-foreground">4. 꿈해몽 칼럼 읽기</b> — 자주 꾸는 꿈의 의미를 칼럼에서 더 깊이 알아볼 수 있어요.</li>
                <li><b className="text-foreground">안심 원칙</b> — 회원가입 없이 100% 익명, 꿈 내용은 저장하지 않아요. 하루 3번까지 무료로 이용할 수 있어요.</li>
              </ol>
            </DialogContent>
          </Dialog>
        </div>
      </nav>
    </header>
  );
}
