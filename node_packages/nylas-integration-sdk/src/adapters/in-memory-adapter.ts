import { NylasCalendar, NylasCredentials, NylasEvent } from "../types";
import { LogLevel } from "../utils/logger";
import { BaseAdapter, BaseAdapterConfig } from "./base-adapter";

/**
 * Configuration options for the InMemoryAdapter
 */
export interface InMemoryAdapterConfig extends BaseAdapterConfig {
  // No additional config needed beyond the base config
}

/**
 * In-Memory Database Adapter
 *
 * This adapter stores everything in memory and is primarily used for testing
 * and development purposes. Data is lost when the application restarts.
 */
export class InMemoryAdapter extends BaseAdapter {
  private credentials: Map<string, NylasCredentials> = new Map();
  private events: Map<string, NylasEvent> = new Map();
  private userEvents: Map<string, Set<string>> = new Map(); // userId -> eventIds
  private calendarEvents: Map<string, Set<string>> = new Map(); // calendarId -> eventIds
  private calendars: Map<string, NylasCalendar> = new Map();
  private userCalendars: Map<string, Set<string>> = new Map(); // userId -> calendarIds

  /**
   * Initialize the in-memory storage with optional logging configuration
   */
  constructor(config?: InMemoryAdapterConfig) {
    super(
      config || {
        tables: {
          credentials: "credentials",
          events: "events",
          calendars: "calendars",
        },
      },
      "InMemoryAdapter",
    );
  }

  /**
   * Initialize the in-memory storage
   */
  async connect(): Promise<void> {
    // No-op for in-memory adapter
    this.logger.info("InMemoryAdapter connected");
    return Promise.resolve();
  }

  /**
   * Clean up resources
   */
  async disconnect(): Promise<void> {
    // No-op for in-memory adapter
    this.logger.info("InMemoryAdapter disconnected");
    return Promise.resolve();
  }

  /**
   * Store credentials for a user
   */
  async storeCredentials(
    userId: string,
    credentials: NylasCredentials,
  ): Promise<void> {
    this.credentials.set(userId, { ...credentials });
    this.logger.dbOperation("store", this.tables.credentials, {
      userId,
      credentials,
    });
    return Promise.resolve();
  }

  /**
   * Get credentials for a user
   */
  async getCredentials(userId: string): Promise<NylasCredentials | null> {
    const credentials = this.credentials.get(userId);
    if (credentials) {
      this.logger.dbOperation("get", this.tables.credentials, {
        userId,
        credentials,
      });
    } else {
      this.logger.info(`No credentials found for user ${userId}`);
    }
    return Promise.resolve(credentials ? { ...credentials } : null);
  }

  /**
   * Delete credentials for a user
   */
  async deleteCredentials(userId: string): Promise<void> {
    this.credentials.delete(userId);
    this.logger.dbOperation("delete", this.tables.credentials, { userId });
    return Promise.resolve();
  }

  /**
   * Store an event
   */
  async storeEvent(
    event: NylasEvent,
    userId: string,
    calendarId: string,
    options?: {
      notify?: boolean;
      participantIds?: string[];
    },
  ): Promise<string> {
    // Generate a unique ID if one is not provided
    const eventId = event.id || crypto.randomUUID();
    const eventWithId = { ...event, id: eventId };

    // Store the event
    this.events.set(eventId, eventWithId);

    // Associate event with user
    if (!this.userEvents.has(userId)) {
      this.userEvents.set(userId, new Set());
    }
    this.userEvents.get(userId)!.add(eventId);

    // Associate event with calendar
    if (!this.calendarEvents.has(calendarId)) {
      this.calendarEvents.set(calendarId, new Set());
    }
    this.calendarEvents.get(calendarId)!.add(eventId);

    this.logger.dbOperation("store", this.tables.events, {
      eventId,
      event: eventWithId,
      userId,
      calendarId,
      options,
    });
    return Promise.resolve(eventId);
  }

  /**
   * Update an event
   */
  async updateEvent(
    eventId: string,
    eventData: Partial<NylasEvent>,
    options?: {
      notify?: boolean;
      participantIds?: string[];
    },
  ): Promise<void> {
    const existingEvent = this.events.get(eventId);
    if (!existingEvent) {
      const error = `Event ${eventId} not found`;
      this.logger.error(error);
      throw new Error(error);
    }

    // Update the event with the new data
    const updatedEvent = { ...existingEvent, ...eventData };
    this.events.set(eventId, updatedEvent);

    this.logger.dbOperation("update", this.tables.events, {
      eventId,
      previousData: existingEvent,
      updatedData: updatedEvent,
      changes: eventData,
    });
    return Promise.resolve();
  }

  /**
   * Delete an event
   */
  async deleteEvent(
    eventId: string,
    options?: {
      calendarId?: string;
      notify?: boolean;
    },
  ): Promise<void> {
    const event = this.events.get(eventId);
    if (!event) {
      const error = `Event ${eventId} not found`;
      this.logger.error(error);
      throw new Error(error);
    }

    // Remove event from storage
    this.events.delete(eventId);

    // Remove event from user associations
    for (const [userId, eventIds] of this.userEvents.entries()) {
      if (eventIds.has(eventId)) {
        eventIds.delete(eventId);
      }
    }

    // Remove event from calendar associations
    for (const [calId, eventIds] of this.calendarEvents.entries()) {
      if (eventIds.has(eventId)) {
        eventIds.delete(eventId);
      }
    }

    this.logger.dbOperation("delete", this.tables.events, {
      eventId,
      deletedEvent: event,
    });
    return Promise.resolve();
  }

  /**
   * Get a single event by ID
   */
  async getEvent(eventId: string): Promise<NylasEvent | null> {
    const event = this.events.get(eventId);
    if (event) {
      this.logger.dbOperation("get", this.tables.events, { eventId, event });
    } else {
      this.logger.info(`No event found with ID ${eventId}`);
    }
    return Promise.resolve(event ? { ...event } : null);
  }

  /**
   * Get events based on filters
   */
  async getEvents(filters?: {
    userId?: string;
    calendarId?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): Promise<NylasEvent[]> {
    let events: NylasEvent[] = [];

    // Filter by user if specified
    if (filters?.userId) {
      const userEventIds = this.userEvents.get(filters.userId);
      if (userEventIds) {
        events = Array.from(userEventIds)
          .map((id) => this.events.get(id))
          .filter(Boolean) as NylasEvent[];
      }
    } // Filter by calendar if specified
    else if (filters?.calendarId) {
      const calendarEventIds = this.calendarEvents.get(filters.calendarId);
      if (calendarEventIds) {
        events = Array.from(calendarEventIds)
          .map((id) => this.events.get(id))
          .filter(Boolean) as NylasEvent[];
      }
    } // Otherwise, return all events
    else {
      events = Array.from(this.events.values());
    }

    // Apply time filters if specified
    if (filters?.startTime || filters?.endTime) {
      events = events.filter((event) => {
        const eventStartTime = event.when.startTime;
        const eventEndTime = event.when.endTime;

        if (!eventStartTime || !eventEndTime) return false;

        const startTimeMatch =
          !filters.startTime || eventEndTime >= filters.startTime;
        const endTimeMatch =
          !filters.endTime || eventStartTime <= filters.endTime;

        return startTimeMatch && endTimeMatch;
      });
    }

    // Apply limit if specified
    if (filters?.limit && filters.limit > 0) {
      events = events.slice(0, filters.limit);
    }

    this.logger.dbOperation("query", this.tables.events, {
      filters,
      count: events.length,
      sample: events.length > 0 ? events[0] : null,
    });
    return Promise.resolve(events);
  }

  /**
   * Store calendar information
   */
  async storeCalendar(userId: string, calendar: NylasCalendar): Promise<void> {
    this.calendars.set(calendar.id, { ...calendar });

    // Associate calendar with user
    if (!this.userCalendars.has(userId)) {
      this.userCalendars.set(userId, new Set());
    }
    this.userCalendars.get(userId)!.add(calendar.id);

    this.logger.dbOperation("store", this.tables.calendars, {
      userId,
      calendar,
    });
    return Promise.resolve();
  }

  /**
   * Get calendars for a user
   */
  async getCalendars(userId: string): Promise<NylasCalendar[]> {
    const calendarIds = this.userCalendars.get(userId);
    if (!calendarIds) {
      this.logger.info(`No calendars found for user ${userId}`);
      return Promise.resolve([]);
    }

    const calendars = Array.from(calendarIds)
      .map((id) => this.calendars.get(id))
      .filter(Boolean) as NylasCalendar[];

    this.logger.dbOperation("query", this.tables.calendars, {
      userId,
      count: calendars.length,
      sample: calendars.length > 0 ? calendars[0] : null,
    });
    return Promise.resolve(calendars);
  }

  /**
   * Get calendar by ID
   */
  async getCalendar(calendarId: string): Promise<NylasCalendar | null> {
    const calendar = this.calendars.get(calendarId);
    if (calendar) {
      this.logger.dbOperation("get", this.tables.calendars, {
        calendarId,
        calendar,
      });
    } else {
      this.logger.info(`No calendar found with ID ${calendarId}`);
    }
    return Promise.resolve(calendar ? { ...calendar } : null);
  }

  /**
   * Execute a custom query (no-op for in-memory adapter)
   */
  async executeQuery<R = any>(query: string, params?: any[]): Promise<R> {
    this.logger.warn("executeQuery is not supported in InMemoryAdapter");
    return Promise.resolve([] as unknown as R);
  }

  /**
   * Mark a credential as expired
   */
  async markCredentialExpired(userId: string): Promise<void> {
    const credentials = this.credentials.get(userId);
    if (credentials) {
      const updatedCredentials = { ...credentials, expiresIn: 0 };
      this.credentials.set(userId, updatedCredentials);
      this.logger.dbOperation("update", this.tables.credentials, {
        userId,
        action: "expired",
        updatedCredentials,
      });
    } else {
      this.logger.warn(
        `No credentials found for user ${userId} to mark as expired`,
      );
    }
    return Promise.resolve();
  }

  /**
   * Check if a credential exists and is valid
   */
  async hasValidCredential(userId: string): Promise<boolean> {
    const credentials = this.credentials.get(userId);
    if (!credentials) {
      this.logger.info(`No credentials found for user ${userId}`);
      return Promise.resolve(false);
    }

    // If no expiresIn is provided, assume the credential is valid
    if (!credentials.expiresIn) {
      this.logger.info(
        `Credentials for user ${userId} have no expiration, considered valid`,
      );
      return Promise.resolve(true);
    }

    // Check if the credential has expired
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = credentials.expiresIn;
    const isValid = now < expiresAt;

    this.logger.info(
      `Credentials for user ${userId} are ${isValid ? "valid" : "expired"}`,
    );
    return Promise.resolve(isValid);
  }
}
