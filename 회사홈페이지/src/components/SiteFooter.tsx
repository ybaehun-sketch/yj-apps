import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/lib/i18n";
import { translations } from "@/lib/translations";

export function SiteFooter() {
  const { lang } = useLanguage();
  const f = translations[lang].footer;

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-2">
        <div>
          <Link to="/" className="font-display text-lg font-bold">YJ <span className="text-primary">Studio</span></Link>
          <dl className="mt-4 space-y-1 text-sm text-muted-foreground">
            <div><dt className="inline">{f.companyLabel}</dt><dd className="inline">{f.companyValue}</dd></div>
            <div><dt className="inline">{f.ceoLabel}</dt><dd className="inline">KETSIRI IRATDA</dd></div>
            <div><dt className="inline">{f.businessLabel}</dt><dd className="inline">{f.businessValue}</dd></div>
            <div><dt className="inline">{f.emailLabel}</dt><dd className="inline"><Link className="hover:text-foreground" to="/" hash="contact" onClick={() => setTimeout(() => document.getElementById("contact-name")?.focus(), 400)}>contact@yjstudio.app</Link></dd></div>
          </dl>
        </div>
        <div className="flex flex-col gap-2 text-sm md:items-end">
          <Link to="/privacy" className="hover:text-accent">{f.privacyLink}</Link>
          <Link to="/terms" className="hover:text-accent">{f.termsLink}</Link>
          <p className="mt-auto pt-4 text-muted-foreground">Copyright © 2026 YJ Studio. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
