import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** 관리자 쿠키가 없으면 요청을 막는 문지기 */
export const requireAdmin = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { isAdminSession } = await import("./admin-session.server");
  if (!(await isAdminSession())) throw new Error("관리자만 이용할 수 있어요.");
  return next();
});

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ password: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { loginWithPassword } = await import("./admin-session.server");
    return loginWithPassword(data.password);
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { logoutSession } = await import("./admin-session.server");
  logoutSession();
  return { ok: true };
});

export const checkAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { isAdminSession } = await import("./admin-session.server");
  return { admin: await isAdminSession() };
});
