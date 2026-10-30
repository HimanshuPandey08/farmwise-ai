import Link from "next/link";

export default function AuthSideBanner() {
  const benefits = [
    {
      icon: "🔍",
      title: "AI Crop Diagnosis",
      description: "Instant disease detection and visual health assessment from field photos.",
    },
    {
      icon: "📚",
      title: "Agricultural Intelligence",
      description: "Science-backed treatment guidance curated from certified agricultural institutes.",
    },
    {
      icon: "🌦️",
      title: "Weather-Aware Recommendations",
      description: "Forecast-integrated spray timing to protect crops under local weather conditions.",
    },
    {
      icon: "🛡️",
      title: "Community Disease Alerts",
      description: "Location-based early warnings to stay ahead of regional pathogen outbreaks.",
    },
  ];

  return (
    <aside className="hidden lg:flex lg:col-span-5 xl:col-span-5 flex-col justify-between bg-green-950 p-10 xl:p-14 text-white relative overflow-hidden">
      {/* Subtle organic background decoration */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-800/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-lime-500/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Top: Branding */}
      <div className="relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-3 transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2 focus:ring-offset-green-950 rounded-lg"
          aria-label="FarmWise AI Home"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-900 border border-emerald-700/60 text-2xl text-lime-400 shadow-sm">
            🌱
          </span>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white">
              FarmWise AI
            </span>
            <span className="text-[11px] font-medium tracking-wide text-emerald-300">
              Agricultural Decision Support
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Main value proposition & Benefits */}
      <div className="relative z-10 my-10 space-y-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-900/70 border border-emerald-700/50 px-3 py-1 text-xs font-semibold text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
            Decision Intelligence for Farmers
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white xl:text-4xl">
            Smarter decisions.
            <br />
            <span className="text-lime-400">Healthier crops.</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-emerald-100/90 max-w-md">
            Use AI-powered crop diagnosis, agricultural knowledge, and community
            intelligence to make more informed farming decisions.
          </p>
        </div>

        {/* Benefits list */}
        <div className="space-y-4 pt-2">
          {benefits.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3.5 rounded-xl border border-emerald-800/50 bg-emerald-900/30 p-3.5 backdrop-blur-sm"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-900/80 text-lg border border-emerald-700/40">
                {item.icon}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-white tracking-wide">
                  {item.title}
                </h3>
                <p className="text-[12px] leading-snug text-emerald-200/80 mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: Trust & privacy notice */}
      <div className="relative z-10 border-t border-emerald-900/80 pt-6">
        <p className="flex items-center gap-2 text-xs text-emerald-300/80">
          <span className="text-sm">🔒</span>
          <span>Privacy-first architecture protecting farmer data & location.</span>
        </p>
      </div>
    </aside>
  );
}
