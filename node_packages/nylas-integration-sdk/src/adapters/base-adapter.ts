import { NylasCalendar, NylasCredentials, NylasEvent } from "../types";
import { createDbLogger, Logger, LogLevel } from "../utils/logger";

/**
 * Base configuration for all adapters
 */
export interface BaseAdapterConfig {
  /**
   * Table names to use in the database
   */
  tables: {
    credentials: string;
    events: string;
    calendars: string;
  };

  /**
   * Logging configuration
   */
  logger?: {
    enabled?: boolean;
    level?: LogLevel;
    prettyPrint?: boolean;
  };

  /**
   * Whether to auto-connect when operations are performed
   * @default true
   */
  autoConnect?: boolean;
}

/**
 * Base adapter class that defines the database adapter contract and implements common functionality
 */
export abstract class BaseAdapter {
  protected tables: {
    credentials: string;
    events: string;
    calendars: string;
  };

  protected logger: Logger;
  protected autoConnect: boolean;
  protected isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  constructor(config: BaseAdapterConfig, adapterName: string) {
    this.tables = {
      credentials: config.tables.credentials,
      events: config.tables.events,
      calendars: config.tables.calendars,
    };

    this.logger = createDbLogger(adapterName, {
      enabled: config.logger?.enabled,
      level: config.logger?.level,
      prettyPrint: config.logger?.prettyPrint,
    });

    // Default to auto-connect unless explicitly disabled
    this.autoConnect = config.autoConnect !== false;
  }

  /**
   * Connect to the database
   */
  abstract connect(): Promise<void>;

  /**
   * Disconnect from the database
   */
  abstract disconnect(): Promise<void>;

  /**
   * Automatically connect to the database if not already connected
   * @private
   */
  protected async autoConnectIfNeeded(): Promise<void> {
    if (this.isConnected) return;

    if (!this.autoConnect) {
      throw new Error(
        "Database not connected. Call connect() first or enable autoConnect in configuration.",
      );
    }

    // If a connection is already in progress, wait for it
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Start a new connection
    try {
      this.connectionPromise = this.connect();
      await this.connectionPromise;
      return;
    } catch (error) {
      this.connectionPromise = null;
      throw error;
    }
  }

  /**
   * Store or update Nylas credentials for a user
   */
  abstract storeCredentials(
    userId: string,
    credentials: NylasCredentials,
  ): Promise<void>;

  /**
   * Get Nylas credentials for a user
   */
  abstract getCredentials(userId: string): Promise<NylasCredentials | null>;

  /**
   * Delete Nylas credentials for a user
   */
  abstract deleteCredentials(userId: string): Promise<void>;

  /**
   * Store a calendar event
   */
  abstract storeEvent(
    event: NylasEvent,
    userId: string,
    calendarId: string,
    options?: {
      notify?: boolean;
      participantIds?: string[];
    },
  ): Promise<string>;

  /**
   * Update a calendar event
   */
  abstract updateEvent(
    eventId: string,
    eventData: Partial<NylasEvent>,
    options?: {
      notify?: boolean;
      participantIds?: string[];
    },
  ): Promise<void>;

  /**
   * Delete a calendar event
   */
  abstract deleteEvent(
    eventId: string,
    options?: {
      calendarId?: string;
      notify?: boolean;
    },
  ): Promise<void>;

  /**
   * Get a single event by ID
   */
  abstract getEvent(eventId: string): Promise<NylasEvent | null>;

  /**
   * Get events based on filters
   */
  abstract getEvents(filters?: {
    userId?: string;
    calendarId?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): Promise<NylasEvent[]>;

  /**
   * Store calendar information
   */
  abstract storeCalendar(
    userId: string,
    calendar: NylasCalendar,
  ): Promise<void>;

  /**
   * Get calendars for a user
   */
  abstract getCalendars(userId: string): Promise<NylasCalendar[]>;

  /**
   * Get calendar by ID
   */
  abstract getCalendar(calendarId: string): Promise<NylasCalendar | null>;

  /**
   * Generic method to execute a custom query
   */
  abstract executeQuery<R = any>(query: string, params?: any[]): Promise<R>;

  /**
   * Mark a credential as expired
   */
  abstract markCredentialExpired(userId: string): Promise<void>;

  /**
   * Check if a credential exists and is valid
   */
  abstract hasValidCredential(userId: string): Promise<boolean>;

  /**
   * Helper method to map a database row to a Nylas event
   */
  protected mapDbRowToNylasEvent(row: any): NylasEvent {
    const startTime = row.start_datetime
      ? Math.floor(new Date(row.start_datetime).getTime() / 1000)
      : undefined;

    const endTime = row.end_datetime
      ? Math.floor(new Date(row.end_datetime).getTime() / 1000)
      : undefined;

    // Structure the event according to Nylas API format
    return {
      id: row.nylas_event_ids?.[0] || row.id, // Use Nylas ID if available, otherwise use row ID
      calendarId: row.nylas_calendar_ids?.[0] || "",
      title: row.title || "",
      description: row.description || "",
      location: row.location || "",
      when: {
        object: row.when_object || "timespan",
        startTime,
        endTime,
      },
      busy: row.busy !== undefined ? row.busy : true,
      grantId: row.grant_id || "",
      readOnly: row.read_only || false,
      // Basic required fields
      object: "event",
      createdAt: row.created_at
        ? Math.floor(new Date(row.created_at).getTime() / 1000)
        : Math.floor(Date.now() / 1000),
      updatedAt: row.updated_at
        ? Math.floor(new Date(row.updated_at).getTime() / 1000)
        : Math.floor(Date.now() / 1000),
    };
  }

  /**
   * Helper method to map a database row to a Nylas calendar
   */
  protected mapDbRowToNylasCalendar(row: any): NylasCalendar {
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      timezone: row.timezone || "UTC",
      hexColor: row.hex_color || undefined,
      hexForegroundColor: row.hex_foreground_color || undefined,
      isPrimary: row.is_primary || false,
      readOnly: row.is_read_only || false,
      isOwnedByUser: row.is_owned_by_user || false,
      object: "calendar",
      grantId: row.grant_id || "",
    };
  }

  /**
   * Helper method to extract date information from a Nylas event
   */
  protected extractDateTimeFromEvent(event: NylasEvent): {
    startDateTime: string | null;
    endDateTime: string | null;
  } {
    let startDateTime = null;
    let endDateTime = null;

    if (
      event.when.object === "timespan" &&
      event.when.startTime &&
      event.when.endTime
    ) {
      startDateTime = new Date(event.when.startTime * 1000).toISOString();
      endDateTime = new Date(event.when.endTime * 1000).toISOString();
    } else if (
      event.when.object === "datespan" &&
      event.when.startDate &&
      event.when.endDate
    ) {
      startDateTime = new Date(event.when.startDate).toISOString();
      endDateTime = new Date(event.when.endDate).toISOString();
    }

    return { startDateTime, endDateTime };
  }

  /**
   * Format an error message consistently
   */
  protected formatError(error: unknown, message: string): string {
    return `${message}: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }
}
