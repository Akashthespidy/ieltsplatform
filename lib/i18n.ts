import "server-only";

const dictionaries = {
  en: () => import("./dictionaries/en.json").then((module) => module.default),
  bn: () => import("./dictionaries/bn.json").then((module) => module.default),
  ja: () => import("./dictionaries/ja.json").then((module) => module.default),
  es: () => import("./dictionaries/es.json").then((module) => module.default),
  ar: () => import("./dictionaries/ar.json").then((module) => module.default),
};

export type Locale = keyof typeof dictionaries;

export const locales: Locale[] = ["en", "bn", "ja", "es", "ar"];

export const defaultLocale: Locale = "en";

export const hasLocale = (locale: string): locale is Locale => {
  return locales.includes(locale as Locale);
};

export const getDictionary = async (locale: Locale) => {
  if (!hasLocale(locale)) {
    return dictionaries[defaultLocale]();
  }
  return dictionaries[locale]();
};
