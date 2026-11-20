import { toPng } from "html-to-image";
import { toast } from "sonner";

export async function shareNode(node: HTMLElement | null, filename: string, text: string) {
  if (!node) return;
  try {
    const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], filename, { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) {
      await nav.share({ files: [file], title: "AI 심층 꿈풀이", text });
      return;
    }
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
    toast.success("이미지를 저장했어요. 인스타·카톡에 공유해 보세요!");
  } catch (e) {
    if ((e as Error)?.name === "AbortError") return;
    toast.error("이미지 생성에 실패했어요. 다시 시도해 주세요.");
  }
}
