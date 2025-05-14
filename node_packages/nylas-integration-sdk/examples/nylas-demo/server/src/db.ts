import path from "path";
import { PostgresAdapter } from "nylas-integration-sdk";
import dns from "dns";

// Set DNS to prefer IPv4 to avoid connectivity issues
dns.setDefaultResultOrder("ipv4first");

/**
 * Creates a database adapter with the specified configuration
 * @param options Configuration options
 * @returns Configured PostgresAdapter instance
 */
export function createDatabaseAdapter(
  options: {
    connectionString: string;
    sslCertPath?: string;
    tableNames: {
      credentials: string;
      events: string;
      calendars: string;
    };
  },
) {
  if (!options.connectionString) {
    throw new Error("Connection string is required");
  }

  // Create adapter with connection string and let SDK handle the parsing
  return new PostgresAdapter({
    connection: options.connectionString,
    ssl: options.sslCertPath
      ? { certificatePath: options.sslCertPath }
      : undefined,
    tables: options.tableNames,
  });
}
