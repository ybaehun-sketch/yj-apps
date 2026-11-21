const HOW_TO_STEPS = [
  {
    step: "01",
    title: "속마음 털어놓기",
    body: "누구에게도 말 못 할 답답함, 서운함, 억울한 일을 입력창에 편하게 적어보세요. 별도 회원가입이나 이름 입력이 필요 없어요.",
  },
  {
    step: "02",
    title: "AI 답변 모드 고르기",
    body: "내 편이 되어 무조건 맞장구쳐 주는 '☕ 무조건 내 편'과 대신 사과를 건네는 '🙇‍♂️ 싹싹 비는 가상 상대' 중 원하는 모드를 선택해요.",
  },
  {
    step: "03",
    title: "종이 태우기와 맞장구 받기",
    body: "외치기 버튼을 누르면 마음을 적은 종이가 재가 되어 날아가고, AI가 다정한 위로와 사이다 처방을 전해줍니다.",
  },
  {
    step: "04",
    title: "소각 영수증 간직하기",
    body: "속이 후련해졌다면 방금 감정을 태운 '소각 영수증' 이미지를 저장하거나 지인에게 가볍게 공유해 보세요.",
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "정말 글이 저장되지 않고 완전히 익명인가요?",
    a: "네. 대나무숲 속풀이는 회원가입이나 로그인을 받지 않으며, 입력하신 글은 AI 답변을 만드는 데 단 한 번만 쓰인 뒤 즉시 지워집니다. 서버나 데이터베이스에 원문을 보관하지 않습니다.",
  },
  {
    q: "'무조건 내 편'과 '싹싹 비는 가상 상대'는 어떻게 다른가요?",
    a: "'무조건 내 편'은 내 입장에 100% 공감하며 속 시원하게 편을 들어주는 모드이고, '싹싹 비는 가상 상대'는 나를 힘들게 한 가상의 상대방 역할로 대신 사과를 건네주는 역할극 모드입니다.",
  },
  {
    q: "하루에 몇 번까지 이용할 수 있나요?",
    a: "하루 1회 기본으로 무료 이용이 가능하며, '잠시 숨 고르기' 5초 휴식을 거치면 하루 최대 2회까지 추가로 더 외칠 수 있습니다. 자정이 지나면 횟수가 새로 초기화됩니다.",
  },
  {
    q: "소각 영수증 이미지에도 내가 쓴 글이 남나요?",
    a: "아니요. 소각 영수증에는 내가 입력한 원문이 들어가지 않고, AI가 건네준 한 줄 처방과 발급 시각·가상 접수 번호만 깔끔하게 담깁니다.",
  },
  {
    q: "마음이 너무 힘들거나 위기 상황일 때는 어떻게 하나요?",
    a: "대나무숲 속풀이는 오락·감정 해소용 서비스이며 전문 상담을 대신할 수 없습니다. 스스로를 해치고 싶은 마음이 들 만큼 힘들 때는 자살예방상담전화(109) 또는 정신건강위기상담전화(1577-0199)로 즉시 연락해 도움을 받으시길 바랍니다.",
  },
] as const;

export function HomeGuideFaq() {
  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="home-how-to" className="flex flex-col gap-4">
        <div>
          <h2 id="home-how-to" className="font-display text-2xl font-bold">
            대나무숲 속풀이 이용방법
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            복잡한 절차 없이 1분 만에 답답한 마음을 비워내는 4단계 방법입니다.
          </p>
        </div>
        <ol className="grid gap-3 sm:grid-cols-2">
          {HOW_TO_STEPS.map((item) => (
            <li
              key={item.step}
              className="rounded-2xl border border-border bg-card/70 p-5"
            >
              <span className="text-xs font-bold tracking-widest text-primary">
                STEP {item.step}
              </span>
              <h3 className="mt-1 font-serif text-lg font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="home-faq" className="flex flex-col gap-4">
        <div>
          <h2 id="home-faq" className="font-display text-2xl font-bold">
            자주 묻는 질문 (FAQ)
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            익명성, 이용 횟수, AI 답변 방식에 대해 가장 많이 궁금해하시는 내용을 모았습니다.
          </p>
        </div>
        <dl className="flex flex-col gap-3">
          {FAQ_ITEMS.map((item) => (
            <div
              key={item.q}
              className="rounded-2xl border border-border bg-card/70 p-5"
            >
              <dt className="font-serif text-base font-bold text-foreground">
                Q. {item.q}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
