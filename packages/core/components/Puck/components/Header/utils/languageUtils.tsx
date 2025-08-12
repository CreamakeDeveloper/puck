import React from "react";

// Dil kodunu ülke koduna çeviren fonksiyon
export function languageCodeToCountry(code: string): string {
  const lower = code.toLowerCase();
  if (lower.includes("-")) {
    return lower.split("-")[1];
  }
  
  const map: Record<string, string> = {
    en: "gb",
    tr: "tr",
    de: "de",
    fr: "fr",
    es: "es",
    it: "it",
    pt: "pt",
    nl: "nl",
    ru: "ru",
    pl: "pl",
    sv: "se",
    no: "no",
    da: "dk",
    fi: "fi",
    el: "gr",
    ar: "sa",
    fa: "ir",
    he: "il",
    zh: "cn",
    ja: "jp",
    ko: "kr",
    hi: "in",
    th: "th",
    vi: "vn",
    id: "id",
    ms: "my",
    bg: "bg",
    ro: "ro",
    uk: "ua",
    cs: "cz",
    sl: "si",
    sk: "sk",
    hr: "hr",
    sr: "rs",
    bs: "ba",
    sq: "al",
    mk: "mk",
    af: "za",
    sw: "tz",
    lv: "lv",
    lt: "lt",
    et: "ee",
    hu: "hu",
    is: "is",
    ga: "ie",
    cy: "gb-wls",
    gd: "gb-sct",
    mt: "mt",
  };
  
  return map[lower] || lower;
}

// CSS class ile bayrak gösteren fonksiyon (flag-icons kütüphanesi için)
export function getFlagClass(languageCode: string): string {
  const countryCode = languageCodeToCountry(languageCode);
  return `fi fi-${countryCode}`;
}

// React element olarak bayrak ikonu döndüren fonksiyon
export function renderFlagIcon(languageCode: string, style?: React.CSSProperties) {
  const flagClass = getFlagClass(languageCode);
  return <span className={flagClass} style={{ marginRight: 8, ...style }} />;
}