import Nylas from "nylas";
import {
  ConflictCheckResult,
  EventSyncOptions,
  ICalendarClient,
  NylasCalendar,
  NylasConfig,
  NylasCreateEventParams,
  NylasCredentials,
  NylasEvent,
  WhenType,
} from "./types";

export class NylasCalendarClient implements ICalendarClient {
  private nylas: Nylas;
  private credentials: NylasCredentials;
  private primaryCalendar: NylasCalendar | null = null;

  constructor(config: NylasConfig, credentials: NylasCredentials) {
    this.credentials = credentials;

    this.nylas = new Nylas({
      apiKey: config.clientSecret,
      apiUri: config.apiUri,
    });
  }

  /**
   * Get all calendars for the authenticated user
   */
  async getCalendars(): Promise<NylasCalendar[]> {
    try {
      const response = await this.nylas.calendars.list({
        identifier: this.credentials.grantId,
        queryParams: { limit: 200 },
      });

      return response.data as unknown as NylasCalendar[];
    } catch (error) {
      console.error("Error fetching calendars:", error);
      throw new Error("Failed to fetch calendars");
    }
  }

  /**
   * Get the primary calendar for the authenticated user
   */
  async getPrimaryCalendar(): Promise<NylasCalendar> {
    // Return cached primary calendar if available
    if (this.primaryCalendar) {
      return this.primaryCalendar;
    }

    try {
      const calendars = await this.getCalendars();

      // Find primary calendar owned by user
      const primaryCalendar =
        calendars.find(
          (calendar) => calendar.isPrimary && calendar.isOwnedByUser,
        ) || calendars[0];

      if (!primaryCalendar) {
        throw new Error("No calendar found for user");
      }

      // Cache the primary calendar
      this.primaryCalendar = primaryCalendar;
      return primaryCalendar;
    } catch (error) {
      console.error("Error getting primary calendar:", error);
      throw new Error("Failed to get primary calendar");
    }
  }

  /**
   * Get events from a specific calendar
   */
  async getEvents(
    calendarId: string,
    options: EventSyncOptions = {},
  ): Promise<NylasEvent[]> {
    try {
      const queryParams: any = {
        calendarId,
      };

      if (options.limit) {
        queryParams.limit = options.limit;
      }

      // Add date range if provided
      if (options.startDate) {
        const startDate =
          options.startDate instanceof Date
            ? Math.floor(options.startDate.getTime() / 1000)
            : Math.floor(new Date(options.startDate).getTime() / 1000);
        queryParams.start = startDate.toString();
      }

      if (options.endDate) {
        const endDate =
          options.endDate instanceof Date
            ? Math.floor(options.endDate.getTime() / 1000)
            : Math.floor(new Date(options.endDate).getTime() / 1000);
        queryParams.end = endDate.toString();
      }

      const response = await this.nylas.events.list({
        identifier: this.credentials.grantId,
        queryParams,
      });

      return response.data as unknown as NylasEvent[];
    } catch (error) {
      console.error("Error fetching events:", error);
      throw new Error("Failed to fetch events");
    }
  }

  /**
   * Get all events from the primary calendar
   */
  async getAllEvents(options: EventSyncOptions = {}): Promise<NylasEvent[]> {
    const primaryCalendar = await this.getPrimaryCalendar();
    return this.getEvents(primaryCalendar.id, options);
  }

  /**
   * Create a new event on a calendar
   */
  async createEvent(params: NylasCreateEventParams): Promise<any> {
    try {
      const eventData: any = {
        title: params.title,
        calendarId: params.calendarId,
      };

      // Add description if provided
      if (params.description) {
        eventData.description = params.description;
      }

      // Add location if provided
      if (params.location) {
        eventData.location = params.location;
      }

      // Add conferencing if provided
      if (params.conferencing) {
        eventData.conferencing = {
          provider: params.conferencing.provider,
          autocreate: {},
        };
      }

      // Add participants if provided
      if (params.participants && params.participants.length > 0) {
        eventData.participants = params.participants.map((p) => ({
          email: p.email,
          name: p.name || "",
          status: "noreply",
        }));
      }

      // Format when object
      const when: any = {};

      // Handle dates or timestamps
      if (typeof params.when.startTime === "number") {
        when.startTime = params.when.startTime;
        when.endTime = params.when.endTime as number;
        when.object = WhenType.Timespan;
      } else {
        when.startDate = params.when.startTime as string;
        when.endDate = params.when.endTime as string;
        when.object = WhenType.Datespan;
      }

      // Add timezone if provided
      if (params.when.timezone) {
        when.startTimezone = params.when.timezone;
        when.endTimezone = params.when.timezone;
      }

      eventData.when = when;

      const response = await this.nylas.events.create({
        identifier: this.credentials.grantId,
        requestBody: eventData,
        queryParams: {
          calendarId: params.calendarId,
          notifyParticipants: true,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error creating event:", error);
      throw new Error("Failed to create event");
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(
    eventId: string,
    params: Partial<NylasCreateEventParams>,
  ): Promise<any> {
    try {
      const eventData: any = {};

      // Need to provide calendarId for the queryParams
      const calendarId =
        params.calendarId ||
        (this.primaryCalendar ? this.primaryCalendar.id : "");

      if (!calendarId) {
        throw new Error("Calendar ID is required for updating an event");
      }

      // Add fields that need to be updated
      if (params.title) eventData.title = params.title;
      if (params.description) eventData.description = params.description;
      if (params.location) eventData.location = params.location;

      // Update when object if provided
      if (params.when) {
        const when: any = {};

        // Handle dates or timestamps
        if (typeof params.when.startTime === "number") {
          when.startTime = params.when.startTime;
          when.endTime = params.when.endTime as number;
          when.object = WhenType.Timespan;
        } else {
          when.startDate = params.when.startTime as string;
          when.endDate = params.when.endTime as string;
          when.object = WhenType.Datespan;
        }

        // Add timezone if provided
        if (params.when.timezone) {
          when.startTimezone = params.when.timezone;
          when.endTimezone = params.when.timezone;
        }

        eventData.when = when;
      }

      // Update participants if provided
      if (params.participants) {
        eventData.participants = params.participants.map((p) => ({
          email: p.email,
          name: p.name || "",
          status: "noreply",
        }));
      }

      // Update conferencing if provided
      if (params.conferencing) {
        eventData.conferencing = {
          provider: params.conferencing.provider,
          autocreate: {},
        };
      }

      const response = await this.nylas.events.update({
        identifier: this.credentials.grantId,
        eventId,
        requestBody: eventData,
        queryParams: {
          calendarId,
          notifyParticipants: true,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error updating event:", error);
      throw new Error("Failed to update event");
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string, calendarId: string): Promise<void> {
    try {
      await this.nylas.events.destroy({
        identifier: this.credentials.grantId,
        eventId,
        queryParams: {
          calendarId,
          notifyParticipants: true,
        },
      });
    } catch (error) {
      console.error("Error deleting event:", error);
      throw new Error("Failed to delete event");
    }
  }

  /**
   * Check if two events overlap in time
   */
  eventsOverlap(event1: NylasEvent, event2: NylasEvent): boolean {
    // Prevent comparing an event to itself
    if (event1.id === event2.id) {
      return false;
    }

    // Extract time information from when object
    const start1 = this.getEventStartTime(event1);
    const end1 = this.getEventEndTime(event1);
    const start2 = this.getEventStartTime(event2);
    const end2 = this.getEventEndTime(event2);

    // If any of the times are missing, can't determine overlap
    if (!start1 || !end1 || !start2 || !end2) {
      return false;
    }

    // Check if the events overlap
    return start1 < end2 && start2 < end1;
  }

  /**
   * Get normalized start time as Date from event
   */
  private getEventStartTime(event: NylasEvent): Date | null {
    if (event.when.startTime) {
      return new Date(event.when.startTime * 1000);
    } else if (event.when.startDate) {
      return new Date(event.when.startDate);
    }
    return null;
  }

  /**
   * Get normalized end time as Date from event
   */
  private getEventEndTime(event: NylasEvent): Date | null {
    if (event.when.endTime) {
      return new Date(event.when.endTime * 1000);
    } else if (event.when.endDate) {
      return new Date(event.when.endDate);
    }
    return null;
  }

  /**
   * Detect conflicts between a potential new event and existing events
   * @param newEvent The event to check (doesn't need to exist yet)
   * @param existingEvents Events to check against for conflicts
   * @private Internal method used by checkTimeConflicts
   */
  private detectEventConflicts(
    newEvent: {
      startTime: number | string;
      endTime: number | string;
      id?: string;
    },
    existingEvents: NylasEvent[],
  ): ConflictCheckResult {
    // Create a temporary event object with the required properties
    const tempEvent: NylasEvent = {
      id: newEvent.id || "temp-id",
      busy: true,
      calendarId: "",
      grantId: "",
      object: "",
      readOnly: false,
      createdAt: 0,
      updatedAt: 0,
      when: {
        object:
          typeof newEvent.startTime === "number" ? "timespan" : "datespan",
        startTime:
          typeof newEvent.startTime === "number"
            ? newEvent.startTime
            : undefined,
        endTime:
          typeof newEvent.endTime === "number" ? newEvent.endTime : undefined,
        startDate:
          typeof newEvent.startTime === "string"
            ? newEvent.startTime
            : undefined,
        endDate:
          typeof newEvent.endTime === "string" ? newEvent.endTime : undefined,
      },
    };

    // Find all conflicting events
    const conflictingEvents = existingEvents
      .filter((existingEvent) => this.eventsOverlap(tempEvent, existingEvent))
      .map((event) => ({
        id: event.id,
        title: event.title,
        when: {
          startTime: event.when.startTime,
          endTime: event.when.endTime,
          startDate: event.when.startDate,
          endDate: event.when.endDate,
        },
      }));

    return {
      hasConflict: conflictingEvents.length > 0,
      conflictingEvents,
    };
  }

  /**
   * Check for conflicts within a specific time range
   * @param startTime Start time (Unix timestamp or ISO string)
   * @param endTime End time (Unix timestamp or ISO string)
   * @param calendarId Optional calendar ID (uses primary calendar if not provided)
   */
  async checkTimeConflicts(
    startTime: number | string,
    endTime: number | string,
    calendarId?: string,
  ): Promise<{
    hasConflict: boolean;
    conflictingEvents: Array<{
      id: string;
      title?: string;
      when: {
        startTime?: number;
        endTime?: number;
        startDate?: string;
        endDate?: string;
      };
    }>;
  }> {
    try {
      // Get the calendar ID if not provided
      const targetCalendarId =
        calendarId || (await this.getPrimaryCalendar()).id;

      // Convert dates to the format expected by the events query
      const queryParams: any = {
        calendarId: targetCalendarId,
      };

      // Add appropriate date range parameters
      if (typeof startTime === "number") {
        queryParams.start = Math.floor(startTime).toString();
        queryParams.end = Math.ceil(endTime as number).toString();
      } else {
        // Convert ISO strings to timestamps for the query
        const startDate = new Date(startTime);
        const endDate = new Date(endTime as string);
        queryParams.start = Math.floor(startDate.getTime() / 1000).toString();
        queryParams.end = Math.ceil(endDate.getTime() / 1000).toString();
      }

      // Fetch all events in this time range
      const response = await this.nylas.events.list({
        identifier: this.credentials.grantId,
        queryParams,
      });

      const events = response.data as unknown as NylasEvent[];

      // Check for conflicts
      return this.detectEventConflicts({ startTime, endTime }, events);
    } catch (error) {
      console.error("Error checking time conflicts:", error);
      throw new Error("Failed to check time conflicts");
    }
  }
}
