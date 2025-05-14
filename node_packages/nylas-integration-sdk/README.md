# Nylas Integration SDK

A lightweight wrapper for the Nylas API that simplifies calendar connections and
event management in your applications. This module provides straightforward
OAuth authentication, calendar operations, and event management using the Nylas
API.

## 🌟 Features

- **OAuth Authentication**: Complete flow with callback handling
- **Calendar Management**: List calendars and find primary calendars
- **Event Operations**: Create, read, update, and delete calendar events
- **Conflict Detection**: Check for scheduling conflicts between events
- **Mobile Deep Linking**: Support for mobile app authentication flows (WIP)
- **Database Integration**: Synchronize Nylas data with your database (WIP)
- **Webhook Handling**: Handle webhooks for event changes (WIP)

## 📚 Table of Contents

- [Installation](#installation)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Authentication Flow](#authentication-flow)
- [Calendar Operations](#calendar-operations)
- [Event Management](#event-management)
- [Demo Application](#demo-application-setup)
- [Database Connection & Compatibility](#database-connection-and-compatibility)
- [Troubleshooting](#troubleshooting)

## 📦 Installation

```bash
npm install nylas-integration-sdk@github:Panasonic-Well-Innovation/innovation_flutter_template#main/node_packages/nylas-integration-sdk
```

## 📋 Prerequisites

Before using this module, you need to:

1. Create a Nylas account at [dashboard.nylas.com](https://dashboard.nylas.com/)
2. Create a new application in the Nylas Dashboard
3. Obtain your **Client ID** and **Client Secret** from your application
   dashboard
4. Configure a **Redirect URI** in your Nylas application settings (e.g.,
   `http://localhost:3001/api/nylas/callback`)

## Quick Start

```typescript
import { NylasAuth, NylasCalendarClient } from "nylas-integration-sdk";

// Configure Nylas with your credentials
const nylasConfig = {
  clientId: "YOUR_NYLAS_CLIENT_ID",
  clientSecret: "YOUR_NYLAS_CLIENT_SECRET",
  redirectUri: "YOUR_REDIRECT_URI",
  apiUri: "https://api.us.nylas.com", // Optional
};

// Create auth service
const auth = new NylasAuth(nylasConfig);

// Generate an auth URL for the user to connect their calendar
const authUrl = auth.getAuthUrl();

// After user authorizes, handle the callback with the code
const handleCallback = async (code) => {
  const result = await auth.handleOAuthCallback(code);

  if (result.success && result.credentials) {
    // Store credentials securely
    const userCredentials = result.credentials;

    // Create a calendar client for this user
    const calendarClient = new NylasCalendarClient(
      nylasConfig,
      userCredentials,
    );

    // Now you can work with the user's calendars and events
    const calendars = await calendarClient.getCalendars();
    console.log(`User has ${calendars.length} calendars`);
  }
};
```

## Authentication Flow

The authentication flow follows the standard OAuth pattern:

1. Generate an authorization URL and redirect the user
2. User authorizes your application at Nylas
3. Nylas redirects back to your application with a code
4. Exchange the code for access credentials

### Generating the Auth URL

```typescript
const auth = new NylasAuth(nylasConfig);
const authUrl = auth.getAuthUrl();
// Redirect user to this URL
```

### Handling the Callback

```typescript
// In your callback route handler
router.get("/callback", async (req, res) => {
  const code = req.query.code;
  const result = await auth.handleOAuthCallback(code);

  if (result.success && result.credentials) {
    // Store credentials for this user
    storeCredentials(userId, result.credentials);
    res.redirect("/success");
  } else {
    res.redirect(
      "/error?message=" + encodeURIComponent(result.error?.message || "Failed"),
    );
  }
});
```

## Calendar Operations

Once you have user credentials, you can access their calendars:

```typescript
// Create a calendar client with the user's credentials
const calendarClient = new NylasCalendarClient(nylasConfig, userCredentials);

// Get all calendars
const calendars = await calendarClient.getCalendars();

// Get the primary calendar
const primaryCalendar = await calendarClient.getPrimaryCalendar();
console.log(`Primary calendar: ${primaryCalendar.name}`);
```

## Event Management

### Reading Events

```typescript
// Get events from a specific calendar
const events = await calendarClient.getEvents(calendarId, {
  startDate: new Date("2023-05-01"),
  endDate: new Date("2023-05-31"),
  limit: 50, // Optional
});

// Or get events from all calendars
const allEvents = await calendarClient.getAllEvents({
  startDate: new Date("2023-05-01"),
  endDate: new Date("2023-05-31"),
});
```

### Creating Events

```typescript
// Create a new event
const newEvent = await calendarClient.createEvent({
  title: "Team Meeting",
  description: "Weekly planning session",
  calendarId: primaryCalendar.id,
  when: {
    startTime: Math.floor(new Date("2023-05-10T10:00:00").getTime() / 1000),
    endTime: Math.floor(new Date("2023-05-10T11:00:00").getTime() / 1000),
    timezone: "America/Los_Angeles",
  },
  participants: [{ email: "colleague@example.com", name: "Colleague" }],
});
```

### Updating and Deleting Events

```typescript
// Update an event
await calendarClient.updateEvent(eventId, {
  title: "Updated Meeting Title",
  description: "Updated description",
  when: {
    startTime: Math.floor(new Date("2023-05-10T11:00:00").getTime() / 1000),
    endTime: Math.floor(new Date("2023-05-10T12:00:00").getTime() / 1000),
  },
});

// Delete an event (requires both event ID and calendar ID)
await calendarClient.deleteEvent(eventId, calendarId);
```

### Checking for Conflicts

```typescript
// Check for schedule conflicts
const conflicts = await calendarClient.checkTimeConflicts(
  Math.floor(new Date("2023-05-10T10:00:00").getTime() / 1000), // startTime
  Math.floor(new Date("2023-05-10T11:00:00").getTime() / 1000), // endTime
  calendarId, // Optional, uses primary calendar if not specified
);

if (conflicts.hasConflict) {
  console.log(`Found ${conflicts.conflictingEvents.length} conflicts`);
}
```

## Demo Application Setup

This repository includes a complete working demo that showcases the SDK's
capabilities.

### Building the Module

Before running the demo, you need to build the Nylas Integration SDK:

```bash
# Make sure you're in the root directory of the project
cd innovation_flutter_template/node_packages/nylas-integration-sdk

# Install dependencies
npm install

# Build the module
npm run build
```

This step is necessary because the demo references the local Nylas integration
module rather than a published version.

### Quick Setup

```bash
# Navigate to the server directory
cd examples/nylas-demo/server

# Install dependencies
npm install

# If you don't already have a .env file, create one with your Nylas credentials:
# echo "NYLAS_CLIENT_ID=your_client_id
# NYLAS_CLIENT_SECRET=your_client_secret
# REDIRECT_URI=http://localhost:3001/api/nylas/callback
# NYLAS_API_URI=https://api.us.nylas.com" > .env
# 
# Optional: Add database connection (PostgreSQL)
# echo "CONNECTION_STRING=postgresql://username:password@hostname:port/database" >> .env

# Start the server
npm run dev

# In a separate terminal, set up the frontend
cd ../client

# Install dependencies
npm install

# Start the client
npm run dev
```

# Access the application

Open your browser and go to http://localhost:5173

> **Note**: Database persistence (auto-creating tables and syncing data) is a
> work in progress feature. The application fully functions without a database
> connection using in-memory storage.

### Implementation Pattern

The demo uses a singleton pattern to manage the Nylas SDK instance:

```typescript
// src/shared/nylas-instance.ts
import { NylasSDK, PostgresAdapter } from "nylas-integration-sdk";

// Singleton instance
let nylasSdkInstance: NylasSDK | null = null;

// Initialize the SDK (with optional database)
export async function initializeNylasSDK() {
  if (nylasSdkInstance) return nylasSdkInstance;

  const config: any = {
    nylas: {
      clientId: process.env.NYLAS_CLIENT_ID!,
      clientSecret: process.env.NYLAS_CLIENT_SECRET!,
      redirectUri: process.env.REDIRECT_URI!,
      apiUri: process.env.NYLAS_API_URI!,
    },
  };

  // Add database adapter if connection string exists
  if (process.env.CONNECTION_STRING) {
    config.dbAdapter = new PostgresAdapter({
      connection: process.env.CONNECTION_STRING,
      tables: {
        credentials: "nylas_credentials",
        events: "nylas_events",
        calendars: "nylas_calendars",
      },
      autoCreateTables: true,
    });
  }

  nylasSdkInstance = new NylasSDK(config);
  await nylasSdkInstance.initialize();
  return nylasSdkInstance;
}

// Get or initialize SDK
export async function getNylasSDK(): Promise<NylasSDK> {
  if (!nylasSdkInstance) await initializeNylasSDK();
  if (!nylasSdkInstance) throw new Error("Failed to initialize Nylas SDK");
  return nylasSdkInstance;
}
```

The demo shows the simplest way to use the module, and optionally connects to a
database for persistence when provided a connection string. See the
`examples/nylas-demo` directory for the complete implementation.

## Database Connection & Compatibility

The module includes robust database connection handling, with special
optimizations for IPv6 networks and cloud providers like Supabase.

### Connection Testing

The module automatically tests database connections and includes intelligent
handling of different network environments:

```typescript
// Connection testing is enabled by default
const config = {
  nylas: {
    clientId: process.env.NYLAS_CLIENT_ID!,
    clientSecret: process.env.NYLAS_CLIENT_SECRET!,
    redirectUri: process.env.REDIRECT_URI!,
  },
  dbAdapter: dbAdapter,
  testConnectionOnInit: true, // Automatically test connection on initialization
};

// The connection test will perform:
// 1. Database connectivity check with a simple query
// 2. Network compatibility testing for IPv4/IPv6
// 3. Detailed error reporting with troubleshooting suggestions
```

### IPv6 Compatibility

The module includes special handling for IPv6-only environments like Supabase:

```typescript
// Auto-detection of Supabase connections
if (connectionString.includes("supabase.co")) {
  // Configure for IPv6 compatibility
  dns.setDefaultResultOrder("verbatim");
}

// For other environments, IPv4 is preferred
// for wider compatibility
dns.setDefaultResultOrder("ipv4first");
```

### Connection Diagnostics Tool

For troubleshooting database connection issues, the module includes a standalone
diagnostic script:

```bash
# Run from the project root
node test-connection.js
```

This script performs comprehensive tests:

- System IPv4/IPv6 configuration check
- DNS resolution testing
- SSL certificate verification
- Database connectivity with fallback options
- Detailed recommendations for fixing connection issues

These connection features ensure the module works reliably across various
network environments and hosting providers.

## 🔍 Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Verify your Client ID and Client Secret are correct
   - Ensure your redirect URI matches exactly what's registered in Nylas
   - Check for typos in your credentials

2. **Calendar Access Issues**:
   - Confirm the user granted proper permissions during OAuth
   - Check that the credentials haven't expired

3. **Event Creation/Update Errors**:
   - Always provide the required `calendarId` parameter
   - Ensure event times are valid Unix timestamps
   - Check that the calendar has write permissions

### Nylas API Errors

- 400 Bad Request: Usually means incorrect parameters or invalid format
- 401 Unauthorized: Credentials issue, might need to re-authenticate
- 404 Not Found: Resource doesn't exist or was deleted
- 429 Too Many Requests: Rate limiting, slow down your requests

## 📄 License

MIT
