import { Globe } from "lucide-react";
import { useLanguage, type Language } from "@/lib/i18n";

const languageOptions: { value: Language; label: string }[] = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "zh-TW", label: "繁體中文" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "es", label: "Español" },
];

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <label className="relative inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/80 px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:border-primary">
      <Globe className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
      <span className="sr-only">Language</span>
      <select
        aria-label="Language"
        value={lang}
        onChange={(e) => setLang(e.target.value as Language)}
        className="cursor-pointer bg-transparent pr-1 text-xs font-medium text-foreground outline-none"
      >
        {languageOptions.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-card text-foreground">
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
