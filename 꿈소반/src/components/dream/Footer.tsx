import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function PolicyModal({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger className="underline-offset-4 hover:underline">{label}</DialogTrigger>
      <DialogContent className="glass max-h-[80vh] overflow-y-auto text-foreground">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-base leading-relaxed text-muted-foreground">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

export function Footer() {
  return (
    <footer className="relative z-10 mt-16 pb-12 text-center text-sm text-muted-foreground">
      <div className="flex justify-center gap-4">
        <PolicyModal label="이용약관" title="이용약관">
          <p>본 서비스는 회원가입 없이 무료로 제공되는 AI 기반 꿈 해석 엔터테인먼트 서비스입니다.</p>
          <p>해몽 결과, 부적 카드, 행운 번호는 재미와 정서적 위로를 위한 참고용이며 의학·법률·재정적 판단의 근거가 될 수 없습니다.</p>
          <p>서비스 운영을 위해 광고가 노출될 수 있으며, 서비스 내용은 사전 고지 없이 변경될 수 있습니다.</p>
        </PolicyModal>
        <PolicyModal label="개인정보처리방침" title="개인정보처리방침">
          <p><b className="text-foreground">완벽한 무저장 원칙.</b> 입력하신 꿈과 고민은 AI 분석 요청에만 일시적으로 사용되며, 응답 직후 메모리에서 소멸됩니다. 어떠한 데이터베이스나 로그에도 저장하지 않습니다.</p>
          <p>회원가입이 없으므로 이름, 연락처, 이메일 등 개인정보를 수집하지 않습니다.</p>
          <p><b className="text-foreground">광고 쿠키 고지.</b> 본 사이트는 Google AdSense 등 제3자 광고 서비스를 사용할 수 있으며, 광고 사업자는 맞춤형 광고 제공을 위해 쿠키를 사용할 수 있습니다. 브라우저 설정에서 쿠키를 거부하실 수 있습니다.</p>
        </PolicyModal>
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
