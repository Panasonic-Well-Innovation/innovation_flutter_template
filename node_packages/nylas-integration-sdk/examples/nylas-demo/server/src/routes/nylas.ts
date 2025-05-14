import Router from "koa-router";
import {
  EventTimeSlot,
  EventWhen,
  NylasAuth,
  NylasCalendar,
  NylasCalendarClient,
  NylasCreateEventParams,
  NylasCredentials,
  NylasEvent,
  NylasParticipant,
  NylasSDK,
} from "nylas-integration-sdk";
import { generateUserUUID, getNylasSDK } from "../shared/nylas-instance";

const router = new Router();

// Store user credentials in memory (in a real app, you'd use a database)
let userCredentials: NylasCredentials | null = null;

// Nylas configuration
const nylasConfig = {
  clientId: process.env.NYLAS_CLIENT_ID || "",
  clientSecret: process.env.NYLAS_CLIENT_SECRET || "",
  redirectUri: process.env.REDIRECT_URI || "",
  apiUri: process.env.NYLAS_API_URI || "",
};

// Fallback Auth for when SDK is not initialized
const fallbackAuth = new NylasAuth(nylasConfig);

// Helper function to get NylasAuth using the singleton pattern
async function getNylasAuth(): Promise<NylasAuth> {
  try {
    const sdk = await getNylasSDK();
    console.log("Using NylasSDK from singleton");
    return sdk.getAuth();
  } catch (error) {
    console.log("Fallback: Using standalone NylasAuth");
    return fallbackAuth;
  }
}

// Test endpoint to check configuration
router.get("/test", async (ctx) => {
  let sdkInitialized = false;

  try {
    // Try to get the SDK instance to determine if it's initialized
    await getNylasSDK();
    sdkInitialized = true;
  } catch (error) {
    // If the SDK initialization fails, sdkInitialized remains false
    console.error("SDK not initialized:", error);
  }

  ctx.body = {
    nylasConfig,
    timestamp: new Date().toISOString(),
    sdkInitialized: sdkInitialized,
  };
});

// Get auth URL
router.get("/auth", async (ctx) => {
  try {
    const auth = await getNylasAuth();
    const authUrl = auth.getAuthUrl();
    ctx.body = { authUrl };
  } catch (error: any) {
    console.error("Error generating auth URL:", error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

// Handle OAuth callback
router.get("/callback", async (ctx) => {
  try {
    const code = ctx.query.code as string;
    const auth = await getNylasAuth();
    const result = await auth.handleOAuthCallback(code);

    if (result.success && result.credentials) {
      // Store credentials (in a real app, save to database)
      userCredentials = result.credentials;

      // Redirect to frontend
      ctx.redirect("http://localhost:5173/calendar");
    } else {
      ctx.redirect(
        `http://localhost:5173/error?message=${
          encodeURIComponent(result.error?.message || "Authentication failed")
        }`,
      );
    }
  } catch (error: any) {
    console.error("Error handling callback:", error);
    ctx.redirect(
      `http://localhost:5173/error?message=${
        encodeURIComponent(error.message)
      }`,
    );
  }
});

// Check if user is connected
router.get("/connected", async (ctx) => {
  try {
    const isConnected = !!userCredentials;

    let userData = null;
    if (isConnected) {
      // If we have credentials, fetch basic user info to confirm
      // credentials are still valid
      const calendarClient = new NylasCalendarClient(
        nylasConfig,
        userCredentials as NylasCredentials,
      );

      try {
        // Fetch calendars as a way to validate the connection
        const calendars = await calendarClient.getCalendars();
        const primaryCalendar = calendars.find((cal) => cal.isPrimary);

        userData = {
          validConnection: true,
          primaryCalendarId: primaryCalendar?.id,
          calendarCount: calendars.length,
        };
      } catch (error) {
        console.error("Error validating connection:", error);
        // Connection failed validation - credentials might be expired
        userData = { validConnection: false };
        userCredentials = null; // Clear invalid credentials
      }
    }

    ctx.body = {
      connected: isConnected && (userData?.validConnection !== false),
      userData: userData,
    };
  } catch (error: any) {
    console.error("Error checking connection status:", error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

// Disconnect user
router.post("/disconnect", (ctx) => {
  userCredentials = null;
  ctx.body = { success: true };
});

// Get calendar events
router.get("/events", async (ctx) => {
  try {
    if (!userCredentials) {
      ctx.status = 401;
      ctx.body = { error: "User not connected to Nylas" };
      return;
    }

    const calendarClient = new NylasCalendarClient(
      nylasConfig,
      userCredentials,
    );

    // Get optional query parameters for filtering
    const startTime = ctx.query.startTime
      ? Number(ctx.query.startTime)
      : undefined;
    const endTime = ctx.query.endTime ? Number(ctx.query.endTime) : undefined;
    const limit = ctx.query.limit ? Number(ctx.query.limit) : undefined;

    // Get events from the API
    const events = await calendarClient.getAllEvents({
      startDate: startTime ? new Date(startTime * 1000) : undefined,
      endDate: endTime ? new Date(endTime * 1000) : undefined,
      limit: limit,
    });

    ctx.body = { events };
  } catch (error: any) {
    console.error("❌ Error fetching events:", error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

// Get all calendars
router.get("/calendars", async (ctx) => {
  try {
    if (!userCredentials) {
      ctx.status = 401;
      ctx.body = { error: "User not connected to Nylas" };
      return;
    }

    const calendarClient = new NylasCalendarClient(
      nylasConfig,
      userCredentials,
    );
    const calendars = await calendarClient.getCalendars();

    ctx.body = { calendars };
  } catch (error: any) {
    console.error("Error fetching calendars:", error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

// Create a new event
router.post("/events", async (ctx) => {
  try {
    console.log("=".repeat(50));
    console.log("🔶 CREATE EVENT - Request received");

    if (!userCredentials) {
      console.log("❌ Error: No user credentials found for event creation");
      ctx.status = 401;
      ctx.body = { error: "User not connected to Nylas" };
      return;
    }

    const eventData = ctx.request.body as NylasCreateEventParams;
    console.log("📝 Event data:", JSON.stringify(eventData, null, 2));

    const calendarClient = new NylasCalendarClient(
      nylasConfig,
      userCredentials,
    );

    // Create event directly through the calendar client
    const newEvent = await calendarClient.createEvent(eventData);
    console.log("✅ Event created successfully:", newEvent);

    ctx.body = { event: newEvent };
  } catch (error: any) {
    console.error("❌ Error creating event:", error);
    console.error("Stack trace:", error.stack);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

// Update an event
router.put("/events/:eventId", async (ctx) => {
  try {
    if (!userCredentials) {
      ctx.status = 401;
      ctx.body = { error: "User not connected to Nylas" };
      return;
    }

    const calendarClient = new NylasCalendarClient(
      nylasConfig,
      userCredentials as NylasCredentials,
    );

    const eventId = ctx.params.eventId;
    const updateData = ctx.request.body as Partial<NylasCreateEventParams>;

    // Ensure calendarId is provided
    if (!updateData.calendarId) {
      ctx.status = 400;
      ctx.body = { error: "Calendar ID is required for updating an event" };
      return;
    }

    console.log("🔄 Updating event:", eventId);
    console.log("📝 Update data:", JSON.stringify(updateData, null, 2));

    await calendarClient.updateEvent(eventId, updateData);
    console.log("✅ Event updated successfully");

    ctx.body = { success: true };
  } catch (error: any) {
    console.error("❌ Error updating event:", error);
    console.error("Stack trace:", error.stack);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

// Delete an event
router.delete("/events/:eventId", async (ctx) => {
  try {
    if (!userCredentials) {
      ctx.status = 401;
      ctx.body = { error: "User not connected to Nylas" };
      return;
    }

    const calendarClient = new NylasCalendarClient(
      nylasConfig,
      userCredentials as NylasCredentials,
    );

    const eventId = ctx.params.eventId;
    const calendarId = ctx.query.calendarId as string;

    console.log("🗑️ Deleting event with ID:", eventId);
    console.log("From calendar ID:", calendarId);

    // The calendarId is REQUIRED by Nylas API
    if (!calendarId) {
      ctx.status = 400;
      ctx.body = { error: "Calendar ID is required for deleting an event" };
      return;
    }

    await calendarClient.deleteEvent(eventId, calendarId);
    console.log("✅ Event deleted successfully");

    ctx.body = { success: true };
  } catch (error: any) {
    console.error("❌ Error deleting event:", error);
    console.error("Stack trace:", error.stack);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

// Get Nylas account and connection info
router.get("/account-info", async (ctx) => {
  try {
    if (!userCredentials) {
      ctx.status = 401;
      ctx.body = { error: "User not connected to Nylas" };
      return;
    }

    // Use the Calendar Client directly
    const calendarClient = new NylasCalendarClient(
      nylasConfig,
      userCredentials as NylasCredentials,
    );

    // Get calendars for account info
    const calendars = await calendarClient.getCalendars();

    // Get primary calendar (for main account info)
    const primaryCalendar = calendars.find((cal) => cal.isPrimary);

    // Get some recent events to show
    const recentEvents = await calendarClient.getAllEvents({
      limit: 5,
      startDate: new Date(),
    });

    ctx.body = {
      account: {
        email: userCredentials.email,
        provider: userCredentials.provider,
        connectionStatus: "connected",
      },
      stats: {
        totalCalendars: calendars.length,
        primaryCalendar: primaryCalendar?.name || "None",
        upcomingEvents: recentEvents.length,
      },
      calendars: calendars,
      recentEvents: recentEvents,
    };
  } catch (error: any) {
    console.error("❌ Error fetching account info:", error);
    console.error("Stack trace:", error.stack);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

// Check for calendar conflicts
router.post("/check-conflicts", async (ctx) => {
  try {
    console.log("Received conflict check request:", ctx.request.body);

    if (!userCredentials) {
      ctx.status = 401;
      ctx.body = { error: "User not connected to Nylas" };
      return;
    }

    const calendarClient = new NylasCalendarClient(
      nylasConfig,
      userCredentials as NylasCredentials,
    );

    // Type casting the request body
    const { startTime, endTime, calendarId, excludeEventId } = ctx.request
      .body as {
        startTime: number | string;
        endTime: number | string;
        calendarId?: string;
        excludeEventId?: string;
      };

    if (!startTime || !endTime) {
      ctx.status = 400;
      ctx.body = { error: "Start time and end time are required" };
      return;
    }

    console.log("Processing conflict check with parameters:", {
      startTime,
      endTime,
      calendarId,
      excludeEventId,
      startTimeType: typeof startTime,
      endTimeType: typeof endTime,
    });

    // Use the SDK's conflict detection
    try {
      // Get all events for the time period
      const conflicts = await calendarClient.checkTimeConflicts(
        startTime,
        endTime,
        calendarId,
      );

      // If there's an excludeEventId, filter it out from the conflicts
      if (excludeEventId && conflicts.hasConflict) {
        const filteredConflicts = conflicts.conflictingEvents.filter(
          (event) => event.id !== excludeEventId,
        );

        // Update the response with filtered conflicts
        conflicts.hasConflict = filteredConflicts.length > 0;
        conflicts.conflictingEvents = filteredConflicts;
      }

      console.log("Conflict check results:", conflicts);

      ctx.body = conflicts;
    } catch (err) {
      console.error("Error in conflict detection:", err);
      throw new Error("Failed to check for conflicts");
    }
  } catch (error: any) {
    console.error("Error checking conflicts:", error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

export const nylasRoutes = router;
