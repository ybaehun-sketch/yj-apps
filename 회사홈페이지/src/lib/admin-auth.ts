import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** 관리자 세션이 없으면 서버 요청을 차단하는 문지기 */
export const requireAdmin = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { ensureLocalEnvLoaded } = await import("./server-env.server");
  await ensureLocalEnvLoaded();
  const { isAdminSession } = await import("./admin-session.server");
  if (!(await isAdminSession())) {
    throw new Error("대표님 전용 관리자 인증이 필요합니다.");
  }
  return next();
});

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ password: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { ensureLocalEnvLoaded } = await import("./server-env.server");
    await ensureLocalEnvLoaded();
    const { loginWithPassword } = await import("./admin-session.server");
    return loginWithPassword(data.password);
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { logoutSession } = await import("./admin-session.server");
  logoutSession();
  return { ok: true };
});

export const checkAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { ensureLocalEnvLoaded } = await import("./server-env.server");
  await ensureLocalEnvLoaded();
  const { isAdminSession } = await import("./admin-session.server");
  return {
    admin: await isAdminSession(),
    configured: Boolean(process.env["ADMIN_PASSWORD"]),
  };
});
