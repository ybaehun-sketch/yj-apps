import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const steps = [
  { title: "1. 마음껏 털어놓기", body: "누구에게도 말 못 한 분노, 억울함, 서운함을 입력창에 편하게 적어보세요." },
  { title: "2. 상대 고르고 태우기", body: "'무조건 내 편' 또는 '싹싹 비는 가상 상대'를 고른 뒤 버튼을 누르면 부적 종이가 활활 타오릅니다." },
  { title: "3. 속 시원한 답장 받기", body: "AI가 내 편에서 맞장구치거나 대신 사과해 줍니다. 작성한 글은 처리 즉시 사라지고 어디에도 저장되지 않아요." },
  { title: "4. 소각 영수증 받기", body: "속이 후련해졌다면 소각 영수증을 받아 저장하거나 SNS로 공유해 보세요." },
  { title: "이용 횟수 안내", body: "하루 1회 무료이며, 5초 숨 고르기 휴식을 거치면 하루 최대 2회 더 외칠 수 있어요." },
];

export function SiteNav() {
  return (
    <nav aria-label="주 메뉴" className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3 text-sm">
        <Link to="/" className="font-display font-bold text-primary">🎋 대나무숲 속풀이</Link>
        <div className="flex items-center gap-4">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground font-semibold" }} className="text-muted-foreground hover:text-foreground">홈</Link>
          <Link to="/about" activeProps={{ className: "text-foreground font-semibold" }} className="text-muted-foreground hover:text-foreground">소개</Link>
          <Link to="/story" activeProps={{ className: "text-foreground font-semibold" }} className="text-muted-foreground hover:text-foreground">속풀이 칼럼</Link>
          <Dialog>
            <DialogTrigger className="text-muted-foreground hover:text-foreground">이용방법</DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>대나무숲 속풀이 이용방법</DialogTitle>
                <DialogDescription>회원가입 없이, 흔적 없이 속을 풀어보세요.</DialogDescription>
              </DialogHeader>
              <ol className="space-y-4">
                {steps.map((s) => (
                  <li key={s.title}>
                    <p className="font-semibold text-foreground">{s.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  </li>
                ))}
              </ol>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </nav>
  );
}
