export interface Country {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  locale: string;
}

export const COUNTRIES: Country[] = [
  { code: "AR", name: "Argentina", currency: "ARS", currencySymbol: "$", timezone: "America/Argentina/Buenos_Aires", locale: "es-AR" },
  { code: "CL", name: "Chile", currency: "CLP", currencySymbol: "$", timezone: "America/Santiago", locale: "es-CL" },
  { code: "CO", name: "Colombia", currency: "COP", currencySymbol: "$", timezone: "America/Bogota", locale: "es-CO" },
  { code: "MX", name: "México", currency: "MXN", currencySymbol: "$", timezone: "America/Mexico_City", locale: "es-MX" },
  { code: "PE", name: "Perú", currency: "PEN", currencySymbol: "S/", timezone: "America/Lima", locale: "es-PE" },
  { code: "BR", name: "Brasil", currency: "BRL", currencySymbol: "R$", timezone: "America/Sao_Paulo", locale: "pt-BR" },
  { code: "EC", name: "Ecuador", currency: "USD", currencySymbol: "$", timezone: "America/Guayaquil", locale: "es-EC" },
  { code: "UY", name: "Uruguay", currency: "UYU", currencySymbol: "$", timezone: "America/Montevideo", locale: "es-UY" },
  { code: "PY", name: "Paraguay", currency: "PYG", currencySymbol: "₲", timezone: "America/Asuncion", locale: "es-PY" },
  { code: "BO", name: "Bolivia", currency: "BOB", currencySymbol: "Bs", timezone: "America/La_Paz", locale: "es-BO" },
  { code: "VE", name: "Venezuela", currency: "USD", currencySymbol: "$", timezone: "America/Caracas", locale: "es-VE" },
  { code: "CR", name: "Costa Rica", currency: "CRC", currencySymbol: "₡", timezone: "America/Costa_Rica", locale: "es-CR" },
  { code: "PA", name: "Panamá", currency: "USD", currencySymbol: "$", timezone: "America/Panama", locale: "es-PA" },
  { code: "DO", name: "República Dominicana", currency: "DOP", currencySymbol: "RD$", timezone: "America/Santo_Domingo", locale: "es-DO" },
  { code: "GT", name: "Guatemala", currency: "GTQ", currencySymbol: "Q", timezone: "America/Guatemala", locale: "es-GT" },
  { code: "HN", name: "Honduras", currency: "HNL", currencySymbol: "L", timezone: "America/Tegucigalpa", locale: "es-HN" },
  { code: "SV", name: "El Salvador", currency: "USD", currencySymbol: "$", timezone: "America/El_Salvador", locale: "es-SV" },
  { code: "NI", name: "Nicaragua", currency: "NIO", currencySymbol: "C$", timezone: "America/Managua", locale: "es-NI" },
  { code: "US", name: "Estados Unidos", currency: "USD", currencySymbol: "$", timezone: "America/New_York", locale: "en-US" },
  { code: "ES", name: "España", currency: "EUR", currencySymbol: "€", timezone: "Europe/Madrid", locale: "es-ES" },
];

/** Detect country from browser timezone */
export function detectCountryFromTimezone(): Country | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Direct match
    const direct = COUNTRIES.find((c) => c.timezone === tz);
    if (direct) return direct;
    // Partial match (e.g. America/Argentina/Cordoba → America/Argentina)
    const partial = COUNTRIES.find((c) => tz.startsWith(c.timezone.split("/").slice(0, 2).join("/")));
    if (partial) return partial;
    return null;
  } catch {
    return null;
  }
}

/** Get country by code */
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

/** Get browser timezone */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "America/New_York";
  }
}

/** Format a product price using the user's country currency settings */
export function formatProductPrice(price: number, countryCode?: string | null): string {
  const country = countryCode ? getCountryByCode(countryCode) : null;
  const symbol = country?.currencySymbol ?? "$";
  const locale = country?.locale ?? "es-CL";
  return `${symbol}${price.toLocaleString(locale)}`;
}
