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

- Admin access is an email allow-list in src/lib/access.ts checked server-side in every admin server function; there are no public user accounts (visitors stay anonymous).
- Blog posts live in the `guides` table: public reads via a published-only RLS policy, writes only through admin server functions using the service client.
