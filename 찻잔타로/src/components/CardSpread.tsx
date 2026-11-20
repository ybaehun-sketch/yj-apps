import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Horizontal card spread: wheel → horizontal, mouse drag, arrow buttons. */
export function CardSpread({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, startX: 0, startLeft: 0, moved: false });
  const [edges, setEdges] = useState({ left: false, right: true });
  const [dragging, setDragging] = useState(false);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const atStart = el.scrollLeft <= 0 && e.deltaY < 0;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && e.deltaY > 0;
      if (atStart || atEnd) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    update();
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", update);
    };
  }, []);

  const by = (dir: number) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={update}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || !ref.current) return;
          drag.current = { down: true, startX: e.clientX, startLeft: ref.current.scrollLeft, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d.down || !ref.current) return;
          const dx = e.clientX - d.startX;
          if (!d.moved && Math.abs(dx) > 5) {
            d.moved = true;
            setDragging(true);
          }
          if (d.moved) ref.current.scrollLeft = d.startLeft - dx;
        }}
        onPointerUp={() => {
          drag.current.down = false;
          setDragging(false);
        }}
        onPointerLeave={() => {
          drag.current.down = false;
          setDragging(false);
        }}
        onClickCapture={(e) => {
          if (drag.current.moved) {
            e.stopPropagation();
            e.preventDefault();
            drag.current.moved = false;
          }
        }}
        onDragStart={(e) => e.preventDefault()}
        className={cn(
          "-mx-3 mt-3 select-none overflow-x-auto px-3 pb-2 pt-6 [scrollbar-width:thin] sm:-mx-5 sm:px-5",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
      >
        {children}
      </div>
      {edges.left && (
        <button
          type="button"
          aria-label="이전 카드 보기"
          onClick={() => by(-1)}
          className="absolute left-0 top-1/2 z-20 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-card/90 text-foreground shadow-md backdrop-blur transition hover:bg-accent"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}
      {edges.right && (
        <button
          type="button"
          aria-label="다음 카드 보기"
          onClick={() => by(1)}
          className="absolute right-0 top-1/2 z-20 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-card/90 text-foreground shadow-md backdrop-blur transition hover:bg-accent"
        >
          <ChevronRight className="size-5" />
        </button>
      )}
    </div>
  );
}
