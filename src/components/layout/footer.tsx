import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Brain } from "lucide-react";

export function Footer() {
  const t = useTranslations("common");

  const columns = [
    {
      title: t("product"),
      links: [
        { href: "/for-companies", label: t("forCompanies") },
        { href: "/for-candidates", label: t("forCandidates") },
        { href: "/pricing", label: t("pricing") },
        { href: "/how-it-works", label: t("howItWorks") },
      ],
    },
    {
      title: t("company"),
      links: [
        { href: "#", label: t("about") },
        { href: "#", label: t("careers") },
        { href: "#", label: t("blog") },
        { href: "#", label: t("contactUs") },
      ],
    },
    {
      title: t("resources"),
      links: [
        { href: "#", label: t("support") },
        { href: "#", label: t("privacyPolicy") },
        { href: "#", label: t("termsOfService") },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Brain className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">TalentHub</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              AI-powered hiring for the Middle East. Smarter. Faster. Better.
            </p>
          </div>

          {/* Link Columns */}
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
              <ul className="mt-4 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
