/**
 * Centralized application configuration
 *
 * Customize these values via environment variables to rebrand the ERP.
 * See .env.example for all available options.
 */
export const APP_CONFIG = {
  /** Application name shown in sidebar and login */
  name: process.env.APP_NAME || "RR7 ERP",

  /** Description shown on login page */
  description: process.env.APP_DESCRIPTION || "Sistema de gestion empresarial",

  /**
   * Domain-specific optional fields
   *
   * These control visibility of features specific to certain business domains.
   * For example, "carril" (lane) is useful for pools/swimming facilities.
   */
  domainFields: {
    /** Show lane field in schedules (useful for pools) */
    scheduleCarril: process.env.ENABLE_CARRIL === "true",
  },
};
