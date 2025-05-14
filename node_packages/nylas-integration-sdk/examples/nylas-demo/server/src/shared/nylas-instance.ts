import { NylasSDK, PostgresAdapter } from "nylas-integration-sdk";
import { v4 as uuidv4, v5 as uuidv5 } from "uuid";

// UUID namespace for consistent user ID generation
const NYLAS_UUID_NAMESPACE = "d6e7f5c3-8b9a-4a1d-9e0f-1c2d3e4f5a6b";

// Singleton instance of NylasSDK
let nylasSdkInstance: NylasSDK | null = null;

/**
 * Generate a consistent UUID from a user identifier (like email)
 * This ensures the same user always gets the same UUID
 *
 * @param identifier A unique identifier for the user (like email address)
 * @returns A valid UUID string to use as user ID in the database
 */
export function generateUserUUID(identifier: string): string {
  if (!identifier) {
    // Fallback to random UUID if no identifier provided
    return uuidv4();
  }

  // Generate a deterministic UUID using v5 (SHA-1 based)
  // This will always generate the same UUID for the same input
  return uuidv5(identifier, NYLAS_UUID_NAMESPACE);
}

/**
 * Initialize the Nylas SDK with optional database connection
 * If no connection string is provided, SDK will be initialized without a database adapter
 */
export async function initializeNylasSDK() {
  if (nylasSdkInstance) {
    console.log("SDK already initialized");
    return nylasSdkInstance;
  }

  try {
    // Get configuration from environment
    const connectionString = process.env.CONNECTION_STRING;
    const sslCertPath = process.env.CERT_PATH;

    // Prepare the SDK configuration
    const config: any = {
      nylas: {
        clientId: process.env.NYLAS_CLIENT_ID!,
        clientSecret: process.env.NYLAS_CLIENT_SECRET!,
        redirectUri: process.env.REDIRECT_URI!,
        apiUri: process.env.NYLAS_API_URI!,
      },
      testConnectionOnInit: true,
    };

    // Create database adapter only if connection string is provided
    if (connectionString) {
      console.log(
        "Connection string found, initializing with database adapter",
      );

      // Create database adapter
      const dbAdapter = new PostgresAdapter({
        connection: connectionString,
        ssl: sslCertPath ? { certificatePath: sslCertPath } : undefined,
        tables: {
          credentials: process.env.TABLE_CREDENTIALS || "nylas_credentials",
          events: process.env.TABLE_EVENTS || "nylas_events",
          calendars: process.env.TABLE_CALENDARS || "nylas_calendars",
        },
        autoCreateTables: true,
      });

      // Add database adapter to config
      config.dbAdapter = dbAdapter;
    } else {
      console.warn(
        "⚠️ WARNING: No CONNECTION_STRING environment variable found",
      );
      console.warn(
        "⚠️ WARNING: Running in memory-only mode - data will NOT sync to database",
      );
      console.log("Initializing without database adapter");
    }

    // Initialize SDK
    console.log("Creating Nylas SDK instance...");
    nylasSdkInstance = new NylasSDK(config);

    // Connect to database and initialize
    await nylasSdkInstance.initialize();
    console.log("✅ Nylas SDK initialized successfully");

    return nylasSdkInstance;
  } catch (error) {
    console.error("Failed to initialize Nylas SDK:", error);
    throw error;
  }
}

/**
 * Get the shared NylasSDK instance
 * Initializes it if not already done
 */
export async function getNylasSDK(): Promise<NylasSDK> {
  if (!nylasSdkInstance) {
    await initializeNylasSDK();
  }

  if (!nylasSdkInstance) {
    throw new Error("Failed to initialize Nylas SDK");
  }

  return nylasSdkInstance;
}

/**
 * Check if Nylas SDK is initialized with database support
 * @returns true if database adapter is available, false otherwise
 */
export function hasDatabaseSupport(): boolean {
  if (!nylasSdkInstance) return false;
  return !!nylasSdkInstance.getDatabaseAdapter();
}

/**
 * Shutdown the SDK when the application terminates
 */
export async function shutdownNylasSDK(): Promise<void> {
  if (nylasSdkInstance) {
    await nylasSdkInstance.shutdown();
    nylasSdkInstance = null;
    console.log("Nylas SDK shutdown successfully");
  }
}
