import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const TERMS = [
  ["서비스 목적", "대나무숲 속풀이은 익명으로 감정을 털어놓고 AI의 맞장구를 받는 오락·감정 해소용 서비스입니다."],
  ["AI 답변 면책", "AI 답변은 재미와 위로를 위한 것으로, 의료·법률·심리 상담 등 전문 서비스를 대신하지 않습니다. 가상 상대의 사과는 허구의 역할극입니다."],
  ["이용 제한", "자동화 도구를 이용한 반복 요청, 타인을 해치려는 목적의 이용은 제한될 수 있습니다. 무료 외치기는 하루 1회, 광고 충전은 하루 2회이며 연속 이용은 3초 간격입니다."],
  ["위기 상황", "스스로를 해치고 싶은 마음이 든다면 자살예방상담전화 109 또는 정신건강위기상담전화 1577-0199로 언제든 연락하세요."],
  ["약관 변경", "약관이 바뀌면 이 페이지에 공지합니다."],
];

const PRIVACY = [
  ["수집하지 않는 정보", "회원가입이 없으며 이름, 연락처, 이메일 등 개인을 알아볼 수 있는 정보를 받지 않습니다."],
  ["작성하신 글", "입력한 글은 AI 답변을 만드는 데 한 번만 쓰이고 즉시 사라집니다. 서버에 저장하거나 기록하지 않습니다."],
  ["기기에 남는 정보", "오늘 사용 횟수, 대기 시간, 소리 설정 같은 숫자만 사용자 기기(브라우저)에 보관됩니다. 브라우저 데이터를 지우면 함께 삭제됩니다."],
  ["광고", "구글 애드센스 등 광고 사업자가 쿠키를 사용해 광고를 보여줄 수 있습니다. 브라우저 설정이나 구글 광고 설정에서 맞춤 광고를 끌 수 있습니다."],
  ["AI 처리", "답변 생성을 위해 글이 AI 제공사에 전달되며, 저장하지 않는 방식으로 요청합니다."],
];

function LegalDialog({ title, items }: { title: string; items: string[][] }) {
  return (
    <Dialog>
      <DialogTrigger className="underline-offset-4 hover:text-foreground hover:underline">{title}</DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
        </DialogHeader>
        <dl className="flex flex-col gap-4 text-sm leading-relaxed">
          {items.map(([h, b]) => (
            <div key={h}>
              <dt className="font-semibold text-primary">{h}</dt>
              <dd className="mt-1 text-muted-foreground">{b}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}

export function LegalFooter() {
  return (
    <footer className="mx-auto mt-12 flex max-w-xl flex-col items-center gap-2 pb-24 text-xs text-muted-foreground">
      <div className="flex gap-4">
        <LegalDialog title="이용약관" items={TERMS} />
        <span aria-hidden>·</span>
        <LegalDialog title="개인정보처리방침" items={PRIVACY} />
        <span aria-hidden>·</span>
        <Link to="/admin" className="underline-offset-2 hover:underline">관리자</Link>
      </div>
      <p>© 2026 와이제이 스튜디오. All rights reserved.</p>
    </footer>
  );
}
