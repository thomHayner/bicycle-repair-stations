import { memo } from "react";
import { useTranslation } from "react-i18next";

export const AdBanner = memo(function AdBanner() {
  const { t } = useTranslation("common");
  return (
    <aside
      className="fixed bottom-0 left-0 right-0 z-[999] bg-white dark:bg-[#0d1220] border-t border-slate-200 dark:border-[#1e2a3a] flex items-center justify-center"
      style={{
        height: "calc(var(--layout-ad-height) + var(--layout-safe-bottom))",
        paddingBottom: "var(--layout-safe-bottom)",
      }}
      role="complementary"
      aria-label={t("advertisement")}
    >
      {/*
        To enable Google AdSense, replace this placeholder with:

        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXX" crossOrigin="anonymous"></script>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-XXXX"
          data-ad-slot="XXXX"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      */}
      <span className="text-xs text-slate-500 dark:text-slate-400 select-none">{t("advertisement")}</span>
    </aside>
  );
});
