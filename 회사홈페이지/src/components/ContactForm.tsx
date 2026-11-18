import { useState } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { translations } from "@/lib/translations";

const CONTACT_EMAIL = "contact@yjstudio.app";

export function ContactForm() {
  const { lang } = useLanguage();
  const f = translations[lang].contact.form;
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be unavailable in restricted contexts
    }
  }

  return (
    <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-border bg-card p-8 shadow-xs">
      <p className="text-sm text-muted-foreground">{f.emailHelper}</p>
      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="mt-4 inline-block font-display text-2xl font-bold tracking-tight text-primary hover:underline md:text-3xl"
      >
        {CONTACT_EMAIL}
      </a>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Mail className="h-4 w-4" />
          {f.openMailApp}
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/60 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
        >
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          {copied ? f.copied : f.copyEmail}
        </button>
      </div>
    </div>
  );
}
