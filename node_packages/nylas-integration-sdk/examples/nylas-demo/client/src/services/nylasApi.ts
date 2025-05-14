// Consolidated interfaces
export interface NylasCalendar {
  id: string;
  name: string;
  description?: string;
  isPrimary: boolean;
  hexColor?: string;
  hexForegroundColor?: string;
  isOwnedByUser?: boolean;
  readOnly: boolean;
  timezone?: string;
  object?: string;
  grantId?: string;
}

export interface CalendarEventWhen {
  startTime?: number;
  endTime?: number;
  startDate?: string;
  endDate?: string;
  object: string;
  timezone?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  calendarId: string;
  when: CalendarEventWhen;
}

export interface EventFormData {
  title: string;
  description: string;
  calendarId: string;
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface ConflictingEvent {
  id: string;
  title?: string;
  when: {
    startTime?: number;
    endTime?: number;
    startDate?: string;
    endDate?: string;
  };
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingEvents: ConflictingEvent[];
}

export interface ConnectionStatus {
  connected: boolean;
}

// Account information interfaces
export interface AccountInfo {
  email: string;
  provider: string;
  connectionStatus: string;
}

export interface AccountStats {
  totalCalendars: number;
  primaryCalendar: string;
  upcomingEvents: number;
}

export interface AccountInfoResponse {
  account: AccountInfo;
  stats: AccountStats;
  calendars: NylasCalendar[];
}

// Default form data factory
export const createDefaultFormData = (): EventFormData => {
  // Create default start and end times
  const now = new Date();
  const roundedNow = new Date(
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0),
  );
  const oneHourLater = new Date(roundedNow.getTime() + 60 * 60 * 1000);

  // Format for datetime-local inputs in local time
  const localStartTime = roundedNow.getFullYear() + "-" +
    String(roundedNow.getMonth() + 1).padStart(2, "0") + "-" +
    String(roundedNow.getDate()).padStart(2, "0") + "T" +
    String(roundedNow.getHours()).padStart(2, "0") + ":" +
    String(roundedNow.getMinutes()).padStart(2, "0");

  const localEndTime = oneHourLater.getFullYear() + "-" +
    String(oneHourLater.getMonth() + 1).padStart(2, "0") + "-" +
    String(oneHourLater.getDate()).padStart(2, "0") + "T" +
    String(oneHourLater.getHours()).padStart(2, "0") + ":" +
    String(oneHourLater.getMinutes()).padStart(2, "0");

  return {
    title: "",
    description: "",
    calendarId: "",
    startTime: localStartTime,
    endTime: localEndTime,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
};

// API Base URL
const API_BASE_URL = "http://localhost:3001/api/nylas";

// Helper functions for date/time conversions
export const unixToLocalISOString = (timestamp: number | undefined): string => {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);

  return date.getFullYear() + "-" +
    String(date.getMonth() + 1).padStart(2, "0") + "-" +
    String(date.getDate()).padStart(2, "0") + "T" +
    String(date.getHours()).padStart(2, "0") + ":" +
    String(date.getMinutes()).padStart(2, "0");
};

export const localISOStringToUnix = (isoString: string): number => {
  const date = new Date(isoString);
  return Math.floor(date.getTime() / 1000);
};

export const formatDateTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString();
};

export const formatDateRange = (
  startTime?: number,
  endTime?: number,
): string => {
  if (!startTime || !endTime) return "";
  return `${formatDateTime(startTime)} - ${formatDateTime(endTime)}`;
};

export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString();
};

export const formatDateStringRange = (
  startDate?: string,
  endDate?: string,
): string => {
  if (!startDate || !endDate) return "";
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

// API Services

export const nylasApi = {
  // Check connection status
  async checkConnectionStatus(): Promise<ConnectionStatus> {
    try {
      const response = await fetch(`${API_BASE_URL}/connected`);
      return await response.json();
    } catch (err) {
      console.error("Error checking connection status:", err);
      throw new Error("Failed to check connection status");
    }
  },

  // Get account information
  async getAccountInfo(): Promise<AccountInfoResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/account-info`);
      if (!response.ok) {
        throw new Error("Failed to fetch account info");
      }
      return await response.json();
    } catch (err) {
      console.error("Error fetching account info:", err);
      throw new Error("Failed to fetch account information");
    }
  },

  // Get calendars
  async getCalendars(): Promise<NylasCalendar[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/calendars`);
      if (!response.ok) {
        throw new Error("Failed to fetch calendars");
      }
      const data = await response.json();
      return data.calendars;
    } catch (err) {
      console.error("Error fetching calendars:", err);
      throw new Error("Failed to fetch calendars");
    }
  },

  // Get events
  async getEvents(): Promise<CalendarEvent[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/events`);
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      const data = await response.json();
      return data.events;
    } catch (err) {
      console.error("Error fetching events:", err);
      throw new Error("Failed to fetch calendar events");
    }
  },

  // Get auth URL
  async getAuthUrl(): Promise<{ authUrl: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth`);
      return await response.json();
    } catch (err) {
      console.error("Error getting auth URL:", err);
      throw new Error("Failed to get authentication URL");
    }
  },

  // Disconnect calendar
  async disconnectCalendar(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/disconnect`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to disconnect from server");
      }
    } catch (err) {
      console.error("Error disconnecting calendar:", err);
      throw new Error("Failed to disconnect properly");
    }
  },

  // Create event
  async createEvent(eventData: {
    title: string;
    description: string;
    calendarId: string;
    when: {
      startTime: number;
      endTime: number;
      timezone: string;
    };
  }): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      return await response.json();
    } catch (err) {
      console.error("Error creating event:", err);
      throw new Error("Failed to create event");
    }
  },

  // Update event
  async updateEvent(eventId: string, eventData: {
    title: string;
    description: string;
    calendarId: string;
    when: {
      startTime: number;
      endTime: number;
      timezone: string;
    };
  }): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error("Failed to update event");
      }

      return await response.json();
    } catch (err) {
      console.error("Error updating event:", err);
      throw new Error("Failed to update event");
    }
  },

  // Delete event
  async deleteEvent(eventId: string, calendarId: string): Promise<void> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/events/${eventId}?calendarId=${
          encodeURIComponent(calendarId)
        }`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete event");
      }
    } catch (err) {
      console.error("Error deleting event:", err);
      throw new Error(
        err instanceof Error ? err.message : "Failed to delete event",
      );
    }
  },

  // Check for conflicts
  async checkTimeConflicts(data: {
    startTime: number;
    endTime: number;
    calendarId?: string;
    excludeEventId?: string;
  }): Promise<ConflictCheckResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/check-conflicts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to check for conflicts");
      }

      return await response.json();
    } catch (err) {
      console.error("Error checking for conflicts:", err);
      throw new Error("Failed to check for calendar conflicts");
    }
  },
};

// Export a helper to convert form data to event data for API calls
export const eventFormToApiData = (formData: EventFormData) => {
  return {
    title: formData.title,
    description: formData.description,
    calendarId: formData.calendarId,
    when: {
      startTime: localISOStringToUnix(formData.startTime),
      endTime: localISOStringToUnix(formData.endTime),
      timezone: formData.timezone,
    },
  };
};
