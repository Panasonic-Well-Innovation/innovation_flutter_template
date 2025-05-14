// Our custom config for Nylas integration
export interface NylasConfig {
  clientId: string;
  clientSecret: string; // Maps to apiKey in the Nylas SDK
  redirectUri: string;
  apiUri?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface NylasCredentials {
  grantId: string;
  accessToken: string;
  email: string;
  provider: string;
  expiresIn?: number;
  idToken?: string;
  tokenType?: string;
  scope?: string;
}

// Define our own calendar and event interfaces based on the Nylas API
export interface NylasCalendar {
  name: string;
  timezone: string;
  hexColor?: string;
  hexForegroundColor?: string;
  grantId: string;
  id: string;
  object: string;
  isPrimary?: boolean;
  readOnly: boolean;
  isOwnedByUser: boolean;
  description?: string;
  location?: string;
}

export enum WhenType {
  Time = "time",
  Timespan = "timespan",
  Date = "date",
  Datespan = "datespan",
}

export interface NylasWhen {
  endDate?: string;
  startDate?: string;
  endTime?: number;
  startTime?: number;
  startTimezone?: string;
  endTimezone?: string;
  object: string;
}

export interface NylasEvent {
  busy: boolean;
  calendarId: string;
  conferencing?: {
    provider: string;
    details?: {
      meetingCode?: string;
      password?: string;
      url?: string;
      phone?: string[];
    };
    autocreate?: Record<string, any>;
  };
  createdAt: number;
  creator?: {
    email: string;
    name?: string;
  };
  description?: string | null;
  grantId: string;
  hideParticipants?: boolean;
  htmlLink?: string;
  icalUid?: string;
  location?: string;
  id: string;
  object: string;
  organizer?: {
    email: string;
    name?: string;
  };
  participants?: Array<{
    email: string;
    name?: string;
    status?: string;
  }>;
  readOnly: boolean;
  reminders?: {
    overrides?: any;
    useDefault: boolean;
  };
  status?: string;
  title?: string;
  updatedAt: number;
  originalStartTime?: number;
  when: NylasWhen;
}

// Simplified create event params for our API
export interface NylasCreateEventParams {
  title: string;
  description?: string;
  location?: string;
  calendarId: string;
  when: {
    startTime: number | string;
    endTime: number | string;
    timezone?: string;
  };
  participants?: Array<{
    email: string;
    name?: string;
  }>;
  conferencing?: {
    provider: string;
  };
}

export interface DeepLinkOptions {
  baseUrl: string;
  additionalParams?: Record<string, string>;
}

export interface AuthResult {
  success: boolean;
  credentials?: NylasCredentials;
  error?: {
    type: string;
    message: string;
  };
}

export interface EventSyncOptions {
  startDate?: Date | string;
  endDate?: Date | string;
  limit?: number;
}

export interface ConflictCheckResult {
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
}

// Interface for Calendar Client to ensure proper typing
export interface ICalendarClient {
  getCalendars(): Promise<NylasCalendar[]>;
  getPrimaryCalendar(): Promise<NylasCalendar>;
  getEvents(
    calendarId: string,
    options?: EventSyncOptions,
  ): Promise<NylasEvent[]>;
  getAllEvents(options?: EventSyncOptions): Promise<NylasEvent[]>;
  createEvent(params: NylasCreateEventParams): Promise<any>;
  updateEvent(
    eventId: string,
    params: Partial<NylasCreateEventParams>,
  ): Promise<any>;
  deleteEvent(eventId: string, calendarId: string): Promise<void>;
  eventsOverlap(event1: NylasEvent, event2: NylasEvent): boolean;
  checkTimeConflicts(
    startTime: number | string,
    endTime: number | string,
    calendarId?: string,
  ): Promise<ConflictCheckResult>;
}
