import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callGemini, getGeminiApiKey, parseGeminiJson } from "./gemini.server";

const CATS = ["idea", "image", "running", "link", "voice", "todo", "gear", "memo"] as const;

export type AiOrganize = { category: (typeof CATS)[number]; summary: string; tags: string[] } | null;

export const organizeWithAi = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ text: z.string().max(4000), kind: z.enum(["text", "image", "link", "voice"]) }).parse(d),
  )
  .handler(async ({ data }): Promise<AiOrganize> => {
    if (!getGeminiApiKey() || !data.text.trim()) return null;
    const instructions = `너는 '톡비서'다. 사용자가 던진 메모를 분류한다. 반드시 JSON 하나만 출력: {"category": one of ${CATS.join("|")}, "summary": 한국어 한 줄 요약(36자 이내), "tags": ["#태그", 최대 3개]}. running=러닝/운동화, gear=운동 장비, todo=할 일, idea=아이디어, link=링크/아티클, memo=기타.`;
    const text = await callGemini({
      instructions,
      input: `종류: ${data.kind}\n내용: ${data.text}`,
      maxOutputTokens: 600,
    });
    const p = parseGeminiJson<{ category?: string; summary?: string; tags?: unknown }>(text);
    if (!p) return null;
    const category = (CATS as readonly string[]).includes(p.category ?? "") ? (p.category as (typeof CATS)[number]) : "memo";
    const tags = Array.isArray(p.tags)
      ? p.tags.filter((t): t is string => typeof t === "string").slice(0, 3).map((t) => (t.startsWith("#") ? t : "#" + t))
      : [];
    return { category, summary: String(p.summary ?? "").slice(0, 60), tags };
  });
