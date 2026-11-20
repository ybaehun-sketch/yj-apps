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
- Keep persona validation, crisis backup detection, fallbacks, and receipt metadata in the browser-safe forest module; keep AI prompts in a server-only helper so response policies are shared and testable without shipping prompts.
- The public ventToForest function performs one non-retained AI request, never logs or persists request text, and clears its input in finally; browser state clears original text when processing finishes, including errors, to uphold privacy.
- Build receipt images only in the browser from result text and locally generated timestamp/ticket metadata; no original vent or remote image storage is needed.
- Keep the transient paper-burning presentation in its own browser-safe component with CSS animation; it must not persist text or transform the page containing the fixed ad dock.
- Admin-only writing lives under `_authenticated/admin`; every admin server function re-checks the email allowlist in `src/lib/access.ts` server-side, and public column pages read only published rows via the publishable client — route guards alone don't protect server functions.
- Story images live in the private `story-images` bucket, uploaded only via an admin server fn and served through `/api/public/story-image/$name` (filename-validated).
