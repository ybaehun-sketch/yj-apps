<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Tarot AI calls live in `src/lib/tarot.functions.ts` server functions (auth-required) that save each message to the database; the browser never calls the AI directly, so keys and prompts stay server-side.
- Payments: PortOne V2 in browser, but credit (leaves/premium) is granted only by `verifyPayment` in `src/lib/payment.functions.ts` after server-side lookup of status+amount against `src/lib/products.ts`; `wallets` table is the source of truth and localStorage is only a cache — prevents tampered amounts and double-credit.
- Pre-launch cost guard lives in `src/lib/access.ts` (admin emails bypass; daily reading cap and per-reading turn cap enforced in `tarot.functions.ts`, mock checkout blocked for non-admins) — keeps AI spend bounded until real PG is live.
- Usage limits (daily readings, turns per reading) are counted from the server-only `usage_events` ledger, never from user-deletable rows; `reading_messages`, `wallets`, `payments` are browser read-only and written only by server functions via the admin client — so users cannot reset limits or forge credit.
- Admin tools (`/admin`, `src/lib/admin.functions.ts`) authorize via `isAdminEmail` on server-verified JWT claims and log every leaf change to service-only `admin_adjustments`; AI failures delete that attempt's `usage_events` row so users aren't charged for failed replies.
- SEO guide posts live in the `guides` table, written only via admin server fns in `src/lib/guides.functions.ts` and read publicly through a narrow anon SELECT policy; `/sitemap.xml` is generated from it so new posts are indexed without code changes.
- Guide images live in the private `guide-images` bucket, uploaded only via admin server fn and served through `/api/public/guide-image/$name` (filename-validated) — workspace blocks public buckets.
