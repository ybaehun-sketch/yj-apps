/** Whisper가 무음/숨소리에서 지어내는 대표 문구 */
const PHRASES = /^(고맙습니다|감사합니다|시청해\s*주셔서\s*감사합니다|구독과\s*좋아요|MBC\s*뉴스|자막|네|음+|아+)[.!~\s]*$/;
export function isSilenceHallucination(t: string): boolean {
  return PHRASES.test(t.trim().replace(/[.!?。]+$/g, "")) || PHRASES.test(t.trim());
}
