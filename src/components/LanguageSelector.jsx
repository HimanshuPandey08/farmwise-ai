"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function LanguageSelector({ className = "" }) {
  const { language, setLanguage, supportedLanguages } = useLanguage();

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <span className="pointer-events-none absolute left-2 text-xs text-gray-500" aria-hidden="true">
        🌐
      </span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        aria-label="Select Language / भाषा चुनें"
        className="cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white py-1.5 pl-7 pr-7 text-xs font-semibold text-gray-800 shadow-sm transition hover:border-green-600 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
      >
        {supportedLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName} ({lang.name})
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 text-[10px] text-gray-400" aria-hidden="true">
        ▼
      </span>
    </div>
  );
}
