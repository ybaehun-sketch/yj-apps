// 운영자(관리자) 이메일. 이 이메일로 로그인한 계정만 글을 쓰고 발행할 수 있어요.
export const ADMIN_EMAILS = ["ybaehun@gmail.com"];
export const isAdminEmail = (email?: string | null) => !!email && ADMIN_EMAILS.includes(email.toLowerCase());
