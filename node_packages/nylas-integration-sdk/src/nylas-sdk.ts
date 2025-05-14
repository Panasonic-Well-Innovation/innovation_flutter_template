import { NylasAuth } from "./auth";
import { NylasCalendarClient } from "./calendar";
import { BaseAdapter } from "./adapters/base-adapter";
import { EventsService } from "./services/events-service";
import {
  NylasCalendar,
  NylasConfig,
  NylasCreateEventParams,
  NylasCredentials,
  NylasEvent,
} from "./types";
import {
  ConnectionTestResult,
  testDatabaseConnection,
} from "./utils/connection-test";

/**
 * Configuration for the Nylas SDK
 */
export interface NylasSDKConfig {
  /**
   * Required Nylas API configuration
   */
  nylas: NylasConfig;

  /**
   * Optional database adapter
   * If not provided, data will not be persisted
   */
  dbAdapter?: BaseAdapter;

  /**
   * Whether to test the database connection on initialization
   * @default true
   */
  testConnectionOnInit?: boolean;

  /**
   * Whether to prefer IPv4 connections when available
   * This can help with connectivity issues on some networks
   * @default true
   */
  preferIpv4?: boolean;
}

/**
 * Main Nylas SDK class
 * This is the entry point for all Nylas functionality
 */
export class NylasSDK {
  private config: NylasConfig;
  private dbAdapter?: BaseAdapter;
  private auth: NylasAuth;
  private eventsService?: EventsService;
  private isInitialized: boolean = false;
  private testConnectionOnInit: boolean = true;
  private preferIpv4: boolean = true;

  /**
   * Create a new Nylas SDK instance
   * @param config Configuration for the SDK
   */
  constructor(config: NylasSDKConfig) {
    this.config = config.nylas;
    this.dbAdapter = config.dbAdapter;
    this.auth = new NylasAuth(this.config);
    this.testConnectionOnInit = config.testConnectionOnInit !== false;
    this.preferIpv4 = config.preferIpv4 !== false;

    // Initialize events service if database adapter is provided
    if (this.dbAdapter) {
      this.eventsService = new EventsService(this.config, this.dbAdapter);
    }
  }

  /**
   * Initialize the SDK by establishing database connections if necessary
   * This is optional - connections will be established automatically when needed
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Connect to database if adapter is provided
      if (this.dbAdapter) {
        console.log("🔄 Nylas SDK: Connecting to database...");
        await this.dbAdapter.connect();
        console.log("✅ Nylas SDK: Database connected successfully");

        // Test the connection if requested
        if (this.testConnectionOnInit) {
          console.log("🔍 Nylas SDK: Testing database connection...");
          const result = await this.testConnection();

          if (result.success) {
            console.log(
              `✅ Nylas SDK: Connection test successful! Server time: ${result.timestamp}`,
            );
          } else {
            console.error(
              `❌ Nylas SDK: Connection test failed: ${result.error}`,
            );
          }
        }
      }
      this.isInitialized = true;
      console.log("✅ Nylas SDK initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Nylas SDK:", error);
      throw error;
    }
  }

  /**
   * Test the database connection
   * @returns The result of a simple database query
   * @throws Error if no database adapter is provided or connection fails
   */
  async testConnection(): Promise<ConnectionTestResult> {
    if (!this.dbAdapter) {
      throw new Error("No database adapter provided. Cannot test connection.");
    }

    return testDatabaseConnection({
      adapter: this.dbAdapter,
      preferIpv4: this.preferIpv4,
    });
  }

  /**
   * Shutdown the SDK and close any open connections
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      if (this.dbAdapter) {
        await this.dbAdapter.disconnect();
      }
      this.isInitialized = false;
    } catch (error) {
      console.error("Error shutting down Nylas SDK:", error);
      throw error;
    }
  }

  /**
   * Get the authentication service
   */
  getAuth(): NylasAuth {
    return this.auth;
  }

  /**
   * Create a new calendar client for a user
   * @param userId User ID to get credentials for
   * @returns NylasCalendarClient instance
   */
  async getCalendarClient(userId: string): Promise<NylasCalendarClient> {
    if (!this.dbAdapter) {
      throw new Error(
        "No database adapter provided. Cannot get user credentials.",
      );
    }

    const credentials = await this.dbAdapter.getCredentials(userId);
    if (!credentials) {
      throw new Error(`No credentials found for user ${userId}`);
    }

    return new NylasCalendarClient(this.config, credentials);
  }

  /**
   * Create a calendar client directly with credentials
   * This is useful for applications that manage credentials themselves
   * @param credentials Nylas credentials
   * @returns NylasCalendarClient instance
   */
  createCalendarClient(credentials: NylasCredentials): NylasCalendarClient {
    return new NylasCalendarClient(this.config, credentials);
  }

  /**
   * Get the events service for managing events with database persistence
   * @returns EventsService instance
   * @throws Error if no database adapter is provided
   */
  getEventsService(): EventsService {
    if (!this.eventsService || !this.dbAdapter) {
      throw new Error(
        "No database adapter provided. Cannot use events service.",
      );
    }
    return this.eventsService;
  }

  /**
   * Store user credentials
   * @param userId User ID to store credentials for
   * @param credentials Nylas credentials to store
   */
  async storeCredentials(
    userId: string,
    credentials: NylasCredentials,
  ): Promise<void> {
    if (!this.dbAdapter) {
      throw new Error(
        "No database adapter provided. Cannot store credentials.",
      );
    }

    await this.dbAdapter.storeCredentials(userId, credentials);
  }

  /**
   * Get the database adapter
   * @returns The database adapter instance
   */
  getDatabaseAdapter(): BaseAdapter | undefined {
    return this.dbAdapter;
  }
}
