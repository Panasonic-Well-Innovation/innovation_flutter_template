import { NylasCalendarClient } from "../calendar";
import { BaseAdapter } from "../adapters/base-adapter";
import {
  NylasConfig,
  NylasCreateEventParams,
  NylasCredentials,
  NylasEvent,
} from "../types";

/**
 * EventsService - Handles CRUD operations for events with one-way sync
 *
 * This service demonstrates how to use the BaseAdapter with Nylas
 * to maintain a one-way sync between your application, Nylas, and your database.
 */
export class EventsService {
  private dbAdapter: BaseAdapter;
  private config: NylasConfig;

  /**
   * Create a new EventsService
   * @param config - Nylas configuration
   * @param dbAdapter - Database adapter implementation
   */
  constructor(config: NylasConfig, dbAdapter: BaseAdapter) {
    this.config = config;
    this.dbAdapter = dbAdapter;
  }

  /**
   * Create an event in both Nylas and the database
   *
   * @param userId - User ID who owns the event
   * @param calendarId - Calendar ID where the event will be created
   * @param event - Event data to create
   * @param options - Additional options
   * @returns The created event's ID
   */
  async createEvent(
    userId: string,
    calendarId: string,
    event: NylasEvent,
    options?: {
      notify?: boolean;
      participantIds?: string[];
    },
  ): Promise<string> {
    // Step 1: Create the event in Nylas
    const nylas = await this.getNylasClient(userId);

    // Map to the expected format
    const createParams: NylasCreateEventParams = {
      calendarId,
      title: event.title || "",
      description: event.description || undefined,
      participants: event.participants,
      location: event.location,
      when: {
        startTime: event.when.startTime || 0,
        endTime: event.when.endTime || 0,
        timezone: event.when.startTimezone,
      },
    };

    const nylasEvent = await nylas.createEvent(createParams);

    // Step 2: Store the event in the database
    await this.dbAdapter.storeEvent(nylasEvent, userId, calendarId, options);

    // Return the Nylas event ID
    return nylasEvent.id;
  }

  /**
   * Update an event in both Nylas and the database
   *
   * @param userId - User ID who owns the event
   * @param eventId - Event ID to update
   * @param eventUpdates - Partial event data to update
   * @param options - Additional options
   */
  async updateEvent(
    userId: string,
    eventId: string,
    eventUpdates: Partial<NylasEvent>,
    options?: {
      notify?: boolean;
      participantIds?: string[];
    },
  ): Promise<void> {
    // Step 1: Update the event in Nylas
    const nylas = await this.getNylasClient(userId);

    // Get the current event to find its calendar ID
    const currentEvent = await this.dbAdapter.getEvent(eventId);
    if (!currentEvent) {
      throw new Error(`Event ${eventId} not found`);
    }

    // Map to the expected format
    const updateParams: Partial<NylasCreateEventParams> = {
      calendarId: currentEvent.calendarId,
      title: eventUpdates.title,
      description:
        eventUpdates.description !== null
          ? eventUpdates.description
          : undefined,
      participants: eventUpdates.participants,
      location: eventUpdates.location,
    };

    // Add when object if it's being updated
    if (eventUpdates.when) {
      updateParams.when = {
        startTime: eventUpdates.when.startTime || 0,
        endTime: eventUpdates.when.endTime || 0,
        timezone: eventUpdates.when.startTimezone,
      };
    }

    await nylas.updateEvent(eventId, updateParams);

    // Step 2: Update the event in the database
    await this.dbAdapter.updateEvent(eventId, eventUpdates, options);
  }

  /**
   * Delete an event from both Nylas and the database
   *
   * @param userId - User ID who owns the event
   * @param eventId - Event ID to delete
   * @param options - Additional options
   */
  async deleteEvent(
    userId: string,
    eventId: string,
    options?: {
      calendarId?: string;
      notify?: boolean;
    },
  ): Promise<void> {
    // Step 1: Get calendarId if not provided
    let calendarId = options?.calendarId;
    if (!calendarId) {
      const event = await this.dbAdapter.getEvent(eventId);
      if (!event) {
        throw new Error(`Event ${eventId} not found`);
      }
      calendarId = event.calendarId;
    }

    // Step 2: Delete the event from Nylas
    const nylas = await this.getNylasClient(userId);
    await nylas.deleteEvent(eventId, calendarId);

    // Step 3: Delete the event from the database
    await this.dbAdapter.deleteEvent(eventId, options);
  }

  /**
   * Get a single event by ID from the database
   *
   * @param eventId - Event ID to retrieve
   * @returns The event or null if not found
   */
  async getEvent(eventId: string): Promise<NylasEvent | null> {
    return this.dbAdapter.getEvent(eventId);
  }

  /**
   * Get events based on filters from the database
   *
   * @param filters - Optional filters to apply
   * @returns List of events matching the filters
   */
  async getEvents(filters?: {
    userId?: string;
    calendarId?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): Promise<NylasEvent[]> {
    return this.dbAdapter.getEvents(filters);
  }

  /**
   * Helper method to get a user's access token
   */
  private async getAccessToken(userId: string): Promise<string> {
    const credentials = await this.dbAdapter.getCredentials(userId);
    if (!credentials || !credentials.accessToken) {
      throw new Error(`No valid credentials found for user ${userId}`);
    }
    return credentials.accessToken;
  }

  /**
   * Helper method to create/get a Nylas client for a user
   */
  private async getNylasClient(userId: string): Promise<NylasCalendarClient> {
    const credentials = await this.dbAdapter.getCredentials(userId);
    if (!credentials) {
      throw new Error(`No credentials found for user ${userId}`);
    }

    return new NylasCalendarClient(this.config, credentials);
  }
}
