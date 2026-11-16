// Browser-only helpers to pull text out of dumped documents (txt/md/csv/pdf).
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const TEXT_EXT = ["txt", "md", "csv", "json", "log"];
const MAX_CHARS = 4000;

export type DocText = { text: string; label: string } | null;

/** Returns extracted text, or null when the type is not supported yet. */
export async function extractDocText(file: File): Promise<DocText> {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (TEXT_EXT.includes(ext) || file.type.startsWith("text/")) {
    const raw = await file.text();
    return { text: truncate(`📄 ${file.name}\n${raw}`), label: file.name };
  }
  if (ext === "pdf" || file.type === "application/pdf") {
    const doc = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    let out = "";
    for (let i = 0; i < Math.min(doc.numPages, 10); i++) {
      const page = await doc.getPage(i + 1);
      const tc = await page.getTextContent();
      out += tc.items.map((it) => ("str" in it ? it.str : "")).join(" ") + "\n";
      if (out.length > MAX_CHARS) break;
    }
    return { text: truncate(`📄 ${file.name}\n${out}`), label: file.name };
  }
  if (ext === "docx" || ext === "pptx") {
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    let out = "";
    if (ext === "docx") {
      const xml = (await zip.file("word/document.xml")?.async("string")) ?? "";
      out = xml.split(/<\/w:p>/).map(xmlText).filter(Boolean).join("\n");
    } else {
      const slides = Object.keys(zip.files)
        .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
        .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]));
      for (let i = 0; i < slides.length && out.length < MAX_CHARS; i++) {
        const xml = (await zip.file(slides[i] as string)?.async("string")) ?? "";
        const t = xml.split(/<\/a:p>/).map(xmlText).filter(Boolean).join(" / ");
        if (t) out += `[슬라이드 ${i + 1}] ${t}\n`;
      }
    }
    return { text: truncate(`📄 ${file.name}\n${out}`), label: file.name };
  }
  return null;
}

function xmlText(chunk: string): string {
  const parts = chunk.match(/<(?:w|a):t[^>]*>([^<]*)<\/(?:w|a):t>/g) ?? [];
  return parts
    .map((p) => p.replace(/<[^>]+>/g, ""))
    .join("")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&")
    .trim();
}

function truncate(t: string): string {
  return t.length > MAX_CHARS ? t.slice(0, MAX_CHARS) : t;
}

/** Base64-encode a Blob (for voice memo upload). */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}
