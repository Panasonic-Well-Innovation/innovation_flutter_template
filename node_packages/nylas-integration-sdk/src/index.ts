// Core types and clients
export * from "./types";
export * from "./auth";
export * from "./calendar";

// Central SDK entry point
export { NylasSDK, NylasSDKConfig } from "./nylas-sdk";

// Re-export version for convenience
export const VERSION = "1.0.0";

// Database adapters - these should be accessible to users who need to create them
export { BaseAdapter, BaseAdapterConfig } from "./adapters/base-adapter";
export { InMemoryAdapter } from "./adapters/in-memory-adapter";
export {
  PostgresAdapter,
  PostgresAdapterConfig,
} from "./adapters/postgres-adapter";

// Logging utilities
export { LogLevel } from "./utils/logger";

// Connection testing utilities
export {
  ConnectionTestConfig,
  ConnectionTestResult,
  setDnsPreferIpv4,
  testDatabaseConnection,
  testIpv6Connectivity,
} from "./utils/connection-test";

// Export service class for advanced usage
export { EventsService } from "./services/events-service";
