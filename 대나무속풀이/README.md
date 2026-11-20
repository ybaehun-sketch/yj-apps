# 대나무숲 속풀이

첨부된 기획서 내용을 바탕으로 'AI 대나무숲' 첫 화면과 전체 사용자 경험(UX) 흐름을 구현해 주세요.

1. 메인 랜딩 & 분위기
- 어둑한 밤 대나무숲 비주얼 톤 (짙은 에메랄드/밤하늘 차콜 배경 + 달빛 네온)
- 헤더 카피: "임금님 귀는 당나귀 귀! 아무에게도 말 못 할 분노, 억울함, 흑역사. 대나무숲에 던져버리고 흔적 없이 태우세요."
- 익명성 안심 뱃지: 🔒 회원가입 없음 · 저장되지 않음 · 완벽한 익명
- 감정 선택 태그 칩 ([직장/알바], [전남친/전여친], [친구/인간관계], [가족], [그냥 세상이 억까함])
- 분노 입력창과 통쾌한 화풀이 제출 버튼 ([🔥 대나무숲에 소리 지르고 태우기])

2. 화풀이 연출 인터랙션 (1~2초)
- 제출 시 화면 진동/지진 효과 및 입력 텍스트가 불꽃에 타서 재가 되거나 바람에 흩어지는 애니메이션
- 안내 문구: "바람 소리에 묻어 흔적도 없이 날려 보내는 중..."

3. 결과 화면 (AI 사이다 반응 & 공유)
- 원문 즉시 소멸: 사용자가 입력한 민감한 원문은 즉시 지우고 남기지 않음
- 무조건 사용자 편을 들어주는 유쾌하고 통쾌한 사이다 AI 맞장구 답변
- 오늘의 대나무숲 처방전 카드 (인스타 스토리/카카오톡 공유 가능한 감성 처방전 카드 이미지 생성/복사/다운로드 기능)

4. 하단 전환 배너 (타로 연계)
- "속은 좀 시원해지셨나요? 분노를 털어내고 나면, 이제 내 마음의 다음 방향이 보이기 시작해요."
- 찻잔 타로로 이어지는 전환 CTA 버튼 (링크: https://warm-moon-tarot-talk.lovable.app)

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://bamboo-burn-bright.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8e9db53f-ea82-4da0-a2fc-db75dfd7d912).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
