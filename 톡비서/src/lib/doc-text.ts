// Browser-only helpers to pull text out of dumped documents.
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const TEXT_EXT = ["txt", "md", "csv", "tsv", "json", "log", "yaml", "yml", "ics", "srt", "vtt", "ini", "conf"];
const MARKUP_EXT = ["html", "htm", "xml", "svg"];
const MAX_CHARS = 4000;

export type DocText = { text: string; label: string; readable: boolean };

/** Extract readable text from supported documents; returns readable: false when text cannot be extracted. */
export async function extractDocText(file: File): Promise<DocText> {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  let body = "";

  try {
    if (MARKUP_EXT.includes(ext)) {
      const raw = await file.text();
      body = decodeEntities(
        raw
          .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " "),
      ).trim();
    } else if (TEXT_EXT.includes(ext) || file.type.startsWith("text/")) {
      body = (await file.text()).trim();
    } else if (ext === "pdf" || file.type === "application/pdf") {
      const doc = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      for (let i = 0; i < Math.min(doc.numPages, 10); i++) {
        const page = await doc.getPage(i + 1);
        const tc = await page.getTextContent();
        body += tc.items.map((it) => ("str" in it ? it.str : "")).join(" ") + "\n";
        if (body.length > MAX_CHARS) break;
      }
      body = body.trim();
    } else if (ext === "docx" || ext === "pptx" || ext === "xlsx" || ext === "hwpx" || ext === "odt" || ext === "ods" || ext === "odp") {
      const { default: JSZip } = await import("jszip");
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      if (ext === "docx") {
        const xml = (await zip.file("word/document.xml")?.async("string")) ?? "";
        body = xml.split(/<\/w:p>/).map((c) => xmlTagText(c, "w:t")).filter(Boolean).join("\n");
      } else if (ext === "pptx") {
        const slides = sortedZipPaths(zip.files, /^ppt\/slides\/slide(\d+)\.xml$/);
        for (let i = 0; i < slides.length && body.length < MAX_CHARS; i++) {
          const xml = (await zip.file(slides[i]!)?.async("string")) ?? "";
          const t = xml.split(/<\/a:p>/).map((c) => xmlTagText(c, "a:t")).filter(Boolean).join(" / ");
          if (t) body += `[슬라이드 ${i + 1}] ${t}\n`;
        }
      } else if (ext === "xlsx") {
        body = await extractXlsx(zip);
      } else if (ext === "hwpx") {
        const sections = sortedZipPaths(zip.files, /^Contents\/section(\d+)\.xml$/i);
        for (let i = 0; i < sections.length && body.length < MAX_CHARS; i++) {
          const xml = (await zip.file(sections[i]!)?.async("string")) ?? "";
          const t = xml.split(/<\/hp:p>|<\/hs:p>/).map((c) => xmlTagText(c, "hp:t")).filter(Boolean).join("\n");
          if (t) body += t + "\n";
        }
      } else {
        const xml = (await zip.file("content.xml")?.async("string")) ?? "";
        body = xml
          .split(/<\/text:p>|<\/text:h>/)
          .map((c) => decodeEntities(c.replace(/<[^>]+>/g, "")).trim())
          .filter(Boolean)
          .join("\n");
      }
      body = body.trim();
    }
  } catch {
    body = "";
  }

  if (!body) return { text: "", label: file.name, readable: false };
  return { text: truncate(`📄 ${file.name}\n${body}`), label: file.name, readable: true };
}

function sortedZipPaths(files: Record<string, unknown>, re: RegExp): string[] {
  return Object.keys(files)
    .filter((n) => re.test(n))
    .sort((a, b) => Number(a.match(re)?.[1] ?? 0) - Number(b.match(re)?.[1] ?? 0));
}

async function extractXlsx(zip: { file: (path: string) => { async: (type: "string") => Promise<string> } | null; files: Record<string, unknown> }): Promise<string> {
  const ssXml = (await zip.file("xl/sharedStrings.xml")?.async("string")) ?? "";
  const shared = ssXml ? ssXml.split(/<\/si>/).map((si) => xmlTagText(si, "t")) : [];
  const sheets = sortedZipPaths(zip.files, /^xl\/worksheets\/sheet(\d+)\.xml$/);
  let out = "";
  for (let i = 0; i < sheets.length && out.length < MAX_CHARS; i++) {
    const xml = (await zip.file(sheets[i]!)?.async("string")) ?? "";
    const rows: string[] = [];
    for (const rowChunk of xml.split(/<\/row>/)) {
      const cells: string[] = [];
      for (const cellMatch of rowChunk.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
        const attrs = cellMatch[1] ?? "";
        const inner = cellMatch[2] ?? "";
        const typeMatch = /\bt="([^"]+)"/.exec(attrs);
        const cellType = typeMatch?.[1] ?? "";
        if (cellType === "s") {
          const idx = Number(/<v>([^<]*)<\/v>/.exec(inner)?.[1] ?? NaN);
          if (!Number.isNaN(idx) && shared[idx]) cells.push(shared[idx]!);
        } else if (cellType === "inlineStr") {
          const t = xmlTagText(inner, "t");
          if (t) cells.push(t);
        } else {
          const v = decodeEntities(/<v>([^<]*)<\/v>/.exec(inner)?.[1] ?? "").trim();
          if (v) cells.push(v);
        }
      }
      if (cells.length) rows.push(cells.join(" | "));
      if (rows.join("\n").length > MAX_CHARS) break;
    }
    if (rows.length) out += `[시트 ${i + 1}]\n${rows.join("\n")}\n`;
  }
  return out.trim();
}

function xmlTagText(chunk: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([^<]*)</${tag}>`, "g");
  const parts = chunk.match(re) ?? [];
  return decodeEntities(parts.map((p) => p.replace(/<[^>]+>/g, "")).join("")).trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function truncate(t: string): string {
  return t.length > MAX_CHARS ? t.slice(0, MAX_CHARS) : t;
}

/** Fetch a signed/cross-origin file as a Blob and trigger a clean local download with its original filename. */
export async function downloadFile(url: string, name?: string | null): Promise<void> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("download failed");
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = name || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
  } catch {
    window.open(url, "_blank", "noreferrer");
  }
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
