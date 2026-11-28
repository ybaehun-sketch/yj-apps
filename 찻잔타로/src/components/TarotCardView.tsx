import cardBack from "@/assets/card-back.jpg";
import { cn } from "@/lib/utils";
import type { TarotCard } from "@/lib/tarot";
import { cardArt, PERSONA_ART } from "@/lib/art";
import { useI18n } from "@/lib/i18n";
import { cardText } from "@/lib/tarot-i18n";

export function PersonaAvatar({ id, emoji, className }: { id: string; emoji: string; className?: string }) {
  const src = PERSONA_ART[id];
  return src ? (
    <img src={src} alt="" width={96} height={96} decoding="async" className={cn("shrink-0 rounded-full border-2 border-gold object-cover", className)} />
  ) : (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-accent", className)}>{emoji}</span>
  );
}

export function CardFace({ card, className }: { card: TarotCard; className?: string }) {
  const { lang } = useI18n();
  const ct = cardText(card, lang);
  const art = cardArt(card.id);
  if (art)
    return (
      <div className={cn("relative h-full w-full overflow-hidden rounded-xl border-2 border-gold bg-card shadow-warm", className)}>
        <img src={art} alt={ct.label} width={640} height={1024} decoding="async" className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cocoa/85 to-transparent px-1 pb-1.5 pt-5 text-center">
          <p className="font-serif text-xs font-bold text-cocoa-foreground sm:text-sm">{ct.name}</p>
        </div>
      </div>
    );
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-between rounded-xl border-2 border-gold bg-card p-2 text-center shadow-warm",
        className,
      )}
    >
      <span className="font-serif text-xs text-muted-foreground">{card.numeral}</span>
      <span className="text-4xl leading-none sm:text-5xl">{card.symbol}</span>
      <div>
        <p className="font-serif text-sm font-bold text-foreground">{ct.name}</p>
        <p className="text-[10px] tracking-wide text-muted-foreground">{card.en}</p>
      </div>
    </div>
  );
}

export function CardBack({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <img
      src={cardBack}
      alt={t("cardBackAlt")}
      width={640}
      height={1024}
      decoding="async"
      fetchPriority="high"
      className={cn("h-full w-full rounded-xl border-2 border-gold object-cover shadow-warm", className)}
    />
  );
}

export function FlipCard({
  card,
  flipped,
  className,
  shimmer,
}: {
  card: TarotCard;
  flipped: boolean;
  className?: string;
  shimmer?: boolean;
}) {
  return (
    <div className={cn("aspect-[5/8] [perspective:1000px]", className)}>
      <div
        className={cn(
          "relative h-full w-full preserve-3d transition-transform duration-700 ease-out",
          flipped && "rotate-y-180",
        )}
      >
        <div className="absolute inset-0 backface-hidden">
          <CardBack />
        </div>
        <div className="absolute inset-0 rotate-y-180 backface-hidden">
          <CardFace card={card} />
          {shimmer && flipped && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
              <div className="shimmer-sweep absolute inset-y-0 w-1/2" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
