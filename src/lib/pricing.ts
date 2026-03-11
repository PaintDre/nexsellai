export interface PlanPricing {
  monthly: number;
  annual: number;
  usdEquiv: { monthly: number; annual: number };
}

export interface CountryPricing {
  currency: string;
  currencySymbol: string;
  locale: string;
  starter: PlanPricing;
  pro: PlanPricing;
}

// All prices are in the smallest display unit of each currency (no cents for CLP/COP/ARS/PYG)
export const PRICING_BY_CURRENCY: Record<string, CountryPricing> = {
  CLP: {
    currency: "CLP",
    currencySymbol: "$",
    locale: "es-CL",
    starter: { monthly: 14990, annual: 149900, usdEquiv: { monthly: 14.99, annual: 149.90 } },
    pro: { monthly: 34990, annual: 349900, usdEquiv: { monthly: 34.99, annual: 349.90 } },
  },
  ARS: {
    currency: "ARS",
    currencySymbol: "$",
    locale: "es-AR",
    starter: { monthly: 14990, annual: 149900, usdEquiv: { monthly: 14.99, annual: 149.90 } },
    pro: { monthly: 34990, annual: 349900, usdEquiv: { monthly: 34.99, annual: 349.90 } },
  },
  COP: {
    currency: "COP",
    currencySymbol: "$",
    locale: "es-CO",
    starter: { monthly: 59900, annual: 599000, usdEquiv: { monthly: 14.99, annual: 149.90 } },
    pro: { monthly: 139900, annual: 1399000, usdEquiv: { monthly: 34.99, annual: 349.90 } },
  },
  MXN: {
    currency: "MXN",
    currencySymbol: "$",
    locale: "es-MX",
    starter: { monthly: 249, annual: 2490, usdEquiv: { monthly: 14.99, annual: 149.90 } },
    pro: { monthly: 599, annual: 5990, usdEquiv: { monthly: 34.99, annual: 349.90 } },
  },
  PEN: {
    currency: "PEN",
    currencySymbol: "S/",
    locale: "es-PE",
    starter: { monthly: 5490, annual: 54900, usdEquiv: { monthly: 14.99, annual: 149.90 } },
    pro: { monthly: 12990, annual: 129900, usdEquiv: { monthly: 34.99, annual: 349.90 } },
  },
  BRL: {
    currency: "BRL",
    currencySymbol: "R$",
    locale: "pt-BR",
    starter: { monthly: 7990, annual: 79900, usdEquiv: { monthly: 14.99, annual: 149.90 } },
    pro: { monthly: 18990, annual: 189900, usdEquiv: { monthly: 34.99, annual: 349.90 } },
  },
  USD: {
    currency: "USD",
    currencySymbol: "$",
    locale: "en-US",
    starter: { monthly: 1499, annual: 14990, usdEquiv: { monthly: 14.99, annual: 149.90 } },
    pro: { monthly: 3499, annual: 34990, usdEquiv: { monthly: 34.99, annual: 349.90 } },
  },
  EUR: {
    currency: "EUR",
    currencySymbol: "€",
    locale: "es-ES",
    starter: { monthly: 1399, annual: 13990, usdEquiv: { monthly: 14.99, annual: 149.90 } },
    pro: { monthly: 3299, annual: 32990, usdEquiv: { monthly: 34.99, annual: 349.90 } },
  },
  UYU: {
    currency: "UYU",
    currencySymbol: "$",
    locale: "es-UY",
    starter: { monthly: 649, annual: 6490, usdEquiv: { monthly: 14.99, annual: 149.90 } },
    pro: { monthly: 1499, annual: 14990, usdEquiv: { monthly: 34.99, annual: 349.90 } },
  },
};

// Map country codes to their currency
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  CL: "CLP", AR: "ARS", CO: "COP", MX: "MXN", PE: "PEN",
  BR: "BRL", EC: "USD", UY: "UYU", PY: "USD", BO: "USD",
  VE: "USD", CR: "USD", PA: "USD", DO: "USD", GT: "USD",
  HN: "USD", SV: "USD", NI: "USD", US: "USD", ES: "EUR",
};

export function getCurrencyForCountry(countryCode: string | null | undefined): string {
  if (!countryCode) return "USD";
  return COUNTRY_TO_CURRENCY[countryCode] || "USD";
}

export function getPricingForCountry(countryCode: string | null | undefined): CountryPricing {
  const currency = getCurrencyForCountry(countryCode);
  return PRICING_BY_CURRENCY[currency] || PRICING_BY_CURRENCY["USD"];
}

/** Format price for display. Handles currencies with/without decimals. */
export function formatPrice(amount: number, currency: string, locale: string): string {
  // Currencies that use cents (divide by 100)
  const centsCurrencies = ["USD", "EUR", "BRL", "PEN", "MXN", "UYU"];
  const isCents = centsCurrencies.includes(currency);
  const displayAmount = isCents ? amount / 100 : amount;

  return displayAmount.toLocaleString(locale, {
    minimumFractionDigits: isCents ? 2 : 0,
    maximumFractionDigits: isCents ? 2 : 0,
  });
}

// CLP prices used for actual MP charges (since MP account is Chilean)
export const CLP_PRICES = {
  starter: { monthly: 14990, annual: 149900 },
  pro: { monthly: 34990, annual: 349900 },
};
