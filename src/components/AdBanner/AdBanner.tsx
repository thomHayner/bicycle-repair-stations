export function AdBanner() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[999] bg-white dark:bg-[#0d1220] border-t border-slate-200 dark:border-[#1e2a3a] flex items-center justify-center"
      style={{ height: 50 }}
      aria-label="Advertisement"
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
      <span className="text-xs text-slate-500 dark:text-slate-400 select-none">Advertisement</span>
    </div>
  );
}
