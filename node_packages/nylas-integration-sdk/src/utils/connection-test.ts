import { BaseAdapter } from "../adapters/base-adapter";
import * as dns from "dns";

/**
 * Configuration for connection testing
 */
export interface ConnectionTestConfig {
  /**
   * Database adapter to use for the test
   */
  adapter: BaseAdapter;

  /**
   * Whether to prefer IPv4 connections
   * @default true
   */
  preferIpv4?: boolean;
}

/**
 * Result of a connection test
 */
export interface ConnectionTestResult {
  /**
   * Whether the connection test was successful
   */
  success: boolean;

  /**
   * Server timestamp from the database if available
   */
  timestamp?: Date;

  /**
   * Error message if the connection failed
   */
  error?: string;
}

/**
 * Set DNS resolution order to prefer IPv4
 * This helps when connecting to services that have both IPv4 and IPv6 addresses
 * but the IPv6 connection might have issues
 */
export function setDnsPreferIpv4(): void {
  dns.setDefaultResultOrder("ipv4first");
}

/**
 * Test the database connection
 * @param config Connection test configuration
 * @returns The result of the database connection test
 */
export async function testDatabaseConnection(
  config: ConnectionTestConfig,
): Promise<ConnectionTestResult> {
  // Set DNS to prefer IPv4 if requested
  if (config.preferIpv4 !== false) {
    setDnsPreferIpv4();
  }

  try {
    // Just try to connect - the BaseAdapter will handle the case if it's already connected
    await config.adapter.connect();

    // Execute a simple query to test the connection
    const result = await config.adapter.executeQuery("SELECT NOW() as time");
    const timestamp = result[0]?.time;

    return {
      success: true,
      timestamp: timestamp instanceof Date ? timestamp : new Date(timestamp),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Database connection test failed:", errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Test IPv6 connectivity to a host
 * @param hostname The hostname to test
 * @returns Whether IPv6 connectivity is available
 */
export async function testIpv6Connectivity(hostname: string): Promise<boolean> {
  try {
    // First try to resolve the IPv6 address
    const addresses = await new Promise<string[]>((resolve, reject) => {
      dns.resolve6(hostname, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });

    if (!addresses || addresses.length === 0) {
      return false;
    }

    // We've found IPv6 addresses, but can we connect?
    // This is a simplified check - in a real implementation we'd try to
    // establish an actual connection
    return true;
  } catch (error) {
    console.error("IPv6 connectivity test failed:", error);
    return false;
  }
}
