import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/inbox" });
  },
  head: () => ({
    meta: [
      { title: "톡비서 — AI 기억 비서" },
      { name: "description", content: "던지기만 하면 AI가 알아서 정리하는 나만의 기억 비서, 톡비서." },
      { property: "og:title", content: "톡비서 — AI 기억 비서" },
      { property: "og:description", content: "던지기만 하면 AI가 알아서 정리하는 나만의 기억 비서, 톡비서." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
