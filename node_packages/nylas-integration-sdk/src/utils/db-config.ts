import * as fs from "fs";
import * as path from "path";
import { BaseAdapterConfig } from "../adapters/base-adapter";
import { LogLevel } from "./logger";

/**
 * Helper to get standard table names
 * @param prefix Optional prefix for table names
 * @returns Object with standard table names
 */
export function getStandardTableNames(prefix: string = ""): {
  credentials: string;
  events: string;
  calendars: string;
} {
  const tablePrefix = prefix ? `${prefix}_` : "";
  return {
    credentials: `${tablePrefix}nylas_credentials`,
    events: `${tablePrefix}nylas_events`,
    calendars: `${tablePrefix}nylas_calendars`,
  };
}

/**
 * Create SSL configuration from certificate path
 * @param certificatePath Path to the SSL certificate
 * @param rejectUnauthorized Whether to reject unauthorized connections (defaults to true)
 */
export function createSSLConfig(
  certificatePath?: string,
  rejectUnauthorized: boolean = true,
): any {
  // If certificate path is provided and exists
  if (certificatePath && fs.existsSync(certificatePath)) {
    return {
      ca: fs.readFileSync(certificatePath).toString(),
      rejectUnauthorized: rejectUnauthorized,
    };
  }

  // Fall back to insecure connection
  return {
    rejectUnauthorized: false,
  };
}

/**
 * Creates a standard base adapter configuration
 * @param options Additional configuration options
 * @returns Base adapter configuration
 */
export function createBaseConfig(options?: {
  tablePrefix?: string;
  enableLogging?: boolean;
  logLevel?: LogLevel;
}): BaseAdapterConfig {
  return {
    tables: getStandardTableNames(options?.tablePrefix),
    logger:
      options?.enableLogging !== false
        ? {
            enabled: true,
            level: options?.logLevel || LogLevel.INFO,
            prettyPrint: true,
          }
        : undefined,
  };
}
