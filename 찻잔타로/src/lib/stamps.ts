const files = import.meta.glob("@/assets/stamps/*.jpg", { eager: true, import: "default" }) as Record<string, string>;
const byId: Record<number, string> = {};
for (const [path, url] of Object.entries(files)) {
  const n = Number(path.match(/(\d+)\.jpg$/)?.[1]);
  if (!Number.isNaN(n)) byId[n] = url;
}
/** 마음 처방전 인증카드 전용 스탬프 그림 */
export const stampFor = (id: number): string | undefined => byId[id];
