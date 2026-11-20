import paperTexture from "@/assets/talisman-paper.jpg";

export function PaperBurn({ text }: { text: string }) {
  return (
    <div className="paper-burn-stage" aria-label="글이 적힌 부적 종이가 아래부터 타서 재로 날아가는 중">
      <div className="talisman-paper">
        <img src={paperTexture} alt="" width={768} height={1024} className="talisman-texture" />
        <div className="talisman-writing font-display">{text}</div>
      </div>
      <div className="paper-fire-edge" aria-hidden="true">
        {Array.from({ length: 15 }, (_, i) => <i key={i} className="paper-flame" />)}
      </div>
      <div className="paper-ashes" aria-hidden="true">
        {Array.from({ length: 18 }, (_, i) => <i key={i} className="paper-ash" />)}
      </div>
    </div>
  );
}