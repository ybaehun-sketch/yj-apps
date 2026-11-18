import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요").max(100),
  email: z.string().trim().email("올바른 이메일을 입력해 주세요").max(255),
  message: z.string().trim().min(1, "문의 내용을 입력해 주세요").max(2000),
  website: z.string().max(0).optional(), // honeypot
});

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => contactSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("contact_submissions")
      .insert({ name: data.name, email: data.email, message: data.message });
    if (error) throw new Error("전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");

    return { ok: true };
  });
