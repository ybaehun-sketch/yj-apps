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
- i18n: UI strings go through `t()` from `src/lib/i18n.ts`, keyed by the Korean source text; AI server functions take an optional `lang` and append `aiLangRule(lang)` while category values stay Korean keys. Why: one lightweight dictionary, stored data stays language-neutral.
