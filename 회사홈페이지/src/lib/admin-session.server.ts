// 관리자 비밀번호 로그인: 서버에서만 실행되는 서명 쿠키 방식 (2층 저장소 꿈소반/대나무속풀이 검증 부품 재활용)
import { getCookie, setCookie, deleteCookie, getRequestHeader } from "@tanstack/react-start/server";

const COOKIE = "yj_studio_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7일
const enc = new TextEncoder();

function secret(): string {
  const s = process.env["ADMIN_SESSION_SECRET"] || process.env["ADMIN_PASSWORD"];
  if (!s) throw new Error("관리자 비밀번호가 서버에 설정되지 않았어요.");
  return s;
}

function toHex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sign(text: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(text)));
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

const fails = new Map<string, { n: number; until: number }>();

export async function loginWithPassword(password: string): Promise<{ ok: boolean; message?: string }> {
  const ip = getRequestHeader("cf-connecting-ip") || getRequestHeader("x-forwarded-for") || "unknown";
  const now = Date.now();
  const f = fails.get(ip);
  if (f && f.until > now) return { ok: false, message: "시도가 너무 많아요. 1분 뒤에 다시 시도해 주세요." };

  const expected = process.env["ADMIN_PASSWORD"];
  if (!expected) {
    return {
      ok: false,
      message: "서버에 관리자 비밀번호(ADMIN_PASSWORD)가 아직 설정되지 않았어요.",
    };
  }

  const good = safeEqual(await sign("pw:" + password), await sign("pw:" + expected));
  if (!good) {
    const n = (f?.n ?? 0) + 1;
    fails.set(ip, { n, until: n >= 5 ? now + 60_000 : 0 });
    await new Promise((r) => setTimeout(r, 600));
    return { ok: false, message: "비밀번호가 맞지 않아요." };
  }
  fails.delete(ip);
  const exp = String(Math.floor(now / 1000) + MAX_AGE);
  setCookie(COOKIE, `${exp}.${await sign("session:" + exp)}`, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return { ok: true };
}

export async function isAdminSession(): Promise<boolean> {
  try {
    if (!process.env["ADMIN_PASSWORD"]) return false;
    const v = getCookie(COOKIE);
    if (!v) return false;
    const [exp, sig] = v.split(".");
    if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
    return safeEqual(sig, await sign("session:" + exp));
  } catch {
    return false;
  }
}

export function logoutSession() {
  deleteCookie(COOKIE, { path: "/" });
}
