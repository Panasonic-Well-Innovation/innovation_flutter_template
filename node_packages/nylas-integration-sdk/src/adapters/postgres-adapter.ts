import { NylasCalendar, NylasCredentials, NylasEvent } from "../types";
import postgres from "postgres";
import { BaseAdapter, BaseAdapterConfig } from "./base-adapter";
import dns from "dns";
import * as fs from "fs";

/**
 * Configuration options for the PostgreSQL adapter
 */
export interface PostgresAdapterConfig extends BaseAdapterConfig {
  /**
   * Database connection string or connection options
   */
  connection:
    | string
    | {
      host: string;
      port?: number;
      database: string;
      user: string;
      password: string;
      ssl?:
        | boolean
        | {
          certificatePath?: string;
          rejectUnauthorized?: boolean;
          [key: string]: any;
        };
    };

  /**
   * SSL configuration options
   * Only used when connection is a string
   */
  ssl?:
    | boolean
    | {
      ca?: string;
      certificatePath?: string;
      rejectUnauthorized?: boolean;
      [key: string]: any;
    };

  /**
   * Whether to automatically create tables if they don't exist
   * @default true
   */
  autoCreateTables?: boolean;
}

/**
 * PostgreSQL Database Adapter
 *
 * This adapter connects directly to a PostgreSQL database for storing Nylas data.
 */
export class PostgresAdapter extends BaseAdapter {
  private sql: postgres.Sql<{}>;
  private autoCreateTables: boolean;

  constructor(config: PostgresAdapterConfig) {
    super(config, "PostgresAdapter");

    // Set DNS options for better IPv6 compatibility
    if (
      typeof config.connection === "string" &&
      config.connection.includes("supabase.co")
    ) {
      this.logger.info("Supabase PostgreSQL detected - configuring for IPv6");

      // Set verbatim DNS order for Supabase (IPv6 only)
      dns.setDefaultResultOrder("verbatim");
    }

    // Handle connection configuration with SSL
    if (typeof config.connection === "string") {
      // Parse connection string if it's a standard PostgreSQL connection string
      const connectionString = config.connection;
      const match = connectionString.match(
        /postgresql:\/\/(.+?):(.+?)@(.+?):(\d+)\/(.+?)(?:\?|$)/,
      );

      if (match) {
        const [, user, password, host, portStr, database] = match;
        const port = parseInt(portStr, 10);

        // Create with object configuration
        const options: postgres.Options<{}> = {
          host,
          port,
          database,
          username: user,
          password,
          types: {
            // Add UUID support for array types
            arrayParser: (value: any) => {
              // Parse UUID arrays correctly
              if (
                typeof value === "string" && value.startsWith("{") &&
                value.endsWith("}")
              ) {
                return value.slice(1, -1).split(",").map((item) => item.trim());
              }
              return value;
            },
          },
        };

        // Process SSL config
        if (config.ssl) {
          // If certificatePath is provided, read the certificate
          if (typeof config.ssl === "object" && config.ssl.certificatePath) {
            const certPath = config.ssl.certificatePath;
            if (fs.existsSync(certPath)) {
              options.ssl = {
                ca: fs.readFileSync(certPath).toString(),
                rejectUnauthorized: config.ssl.rejectUnauthorized !== false,
              };
            } else {
              this.logger.warn(
                `SSL certificate not found at ${certPath}, using insecure connection`,
              );
              options.ssl = { rejectUnauthorized: false };
            }
          } else {
            // Use provided SSL config
            options.ssl = config.ssl;
          }
        }

        this.sql = postgres(options);
      } else {
        // String connection, but not parsed - create client with connection string
        const options: postgres.Options<{}> = {
          connection: {
            options: connectionString,
          },
          types: {
            // Add UUID support for array types
            arrayParser: (value: any) => {
              // Parse UUID arrays correctly
              if (
                typeof value === "string" && value.startsWith("{") &&
                value.endsWith("}")
              ) {
                return value.slice(1, -1).split(",").map((item) => item.trim());
              }
              return value;
            },
          },
        };

        // Process SSL config
        if (config.ssl) {
          // If certificatePath is provided, read the certificate
          if (typeof config.ssl === "object" && config.ssl.certificatePath) {
            const certPath = config.ssl.certificatePath;
            if (fs.existsSync(certPath)) {
              options.ssl = {
                ca: fs.readFileSync(certPath).toString(),
                rejectUnauthorized: config.ssl.rejectUnauthorized !== false,
              };
            } else {
              this.logger.warn(
                `SSL certificate not found at ${certPath}, using insecure connection`,
              );
              options.ssl = { rejectUnauthorized: false };
            }
          } else {
            // Use provided SSL config
            options.ssl = config.ssl;
          }
        }

        this.sql = postgres(options);
      }
    } else {
      // Object connection - create client with options
      const options: postgres.Options<{}> = {
        host: config.connection.host,
        port: config.connection.port,
        database: config.connection.database,
        username: config.connection.user,
        password: config.connection.password,
        types: {
          // Add UUID support for array types
          arrayParser: (value: any) => {
            // Parse UUID arrays correctly
            if (
              typeof value === "string" && value.startsWith("{") &&
              value.endsWith("}")
            ) {
              return value.slice(1, -1).split(",").map((item) => item.trim());
            }
            return value;
          },
        },
      };

      // Process SSL config
      if (config.connection.ssl) {
        // If certificatePath is provided, read the certificate
        if (
          typeof config.connection.ssl === "object" &&
          config.connection.ssl.certificatePath
        ) {
          const certPath = config.connection.ssl.certificatePath;
          if (fs.existsSync(certPath)) {
            options.ssl = {
              ca: fs.readFileSync(certPath).toString(),
              rejectUnauthorized:
                config.connection.ssl.rejectUnauthorized !== false,
            };
          } else {
            this.logger.warn(
              `SSL certificate not found at ${certPath}, using insecure connection`,
            );
            options.ssl = { rejectUnauthorized: false };
          }
        } else {
          // Use provided SSL config
          options.ssl = config.connection.ssl;
        }
      }

      this.sql = postgres(options);
    }

    this.autoCreateTables = config.autoCreateTables !== false;
  }

  /**
   * Connect to the database and create tables if necessary
   */
  async connect(): Promise<void> {
    // If already connected, do nothing
    if (this.isConnected) {
      return;
    }

    try {
      // For Supabase (IPv6 support)
      if (
        typeof this.sql.options?.connection?.options === "string" &&
        this.sql.options.connection.options.includes("supabase.co")
      ) {
        // Set verbatim DNS order for direct connection
        dns.setDefaultResultOrder("verbatim");
      }

      // Start connection
      this.logger.info("Connecting to PostgreSQL database...");

      // Execute a simple query to test connection
      const result = await this.sql`SELECT 1 AS connected`;

      if (result && result.length > 0) {
        this.isConnected = true;
        this.logger.info("Successfully connected to PostgreSQL database");

        // Create tables if auto-creation is enabled
        if (this.autoCreateTables) {
          await this.createTablesIfNotExist();
        }
      } else {
        throw new Error("Connection test query returned empty result");
      }
    } catch (error: any) {
      // Enhanced error logging with IPv6 connection advice
      if (
        error.message &&
        (error.message.includes("network socket disconnected") ||
          error.message.includes("connect ETIMEDOUT") ||
          error.message.includes("getaddrinfo"))
      ) {
        this.logger.error(
          "Failed to connect to PostgreSQL: " +
            error.message +
            "\n" +
            "This might be an IPv6 connectivity issue. If using Supabase, ensure your network has IPv6 connectivity.",
        );
      } else {
        this.logger.error("Failed to connect to PostgreSQL: " + error.message);
      }

      throw new Error("Failed to connect to PostgreSQL: " + error.message);
    }
  }

  /**
   * Create the required tables if they don't exist
   */
  private async createTablesIfNotExist(): Promise<void> {
    try {
      // Begin a transaction
      await this.sql.begin(async (sql) => {
        // Create credentials table
        await sql`
          CREATE TABLE IF NOT EXISTS ${sql(this.tables.credentials)} (
            user_id UUID PRIMARY KEY,
            grant_id TEXT NOT NULL,
            access_token TEXT NOT NULL,
            email TEXT NOT NULL,
            provider TEXT NOT NULL,
            expires_at TIMESTAMP,
            id_token TEXT,
            token_type TEXT,
            scope TEXT,
            grant_expired BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `;

        // Create calendars table
        await sql`
          CREATE TABLE IF NOT EXISTS ${sql(this.tables.calendars)} (
            id TEXT PRIMARY KEY,
            user_id UUID NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            timezone TEXT,
            hex_color TEXT,
            hex_foreground_color TEXT,
            is_primary BOOLEAN DEFAULT FALSE,
            is_read_only BOOLEAN DEFAULT FALSE,
            is_owned_by_user BOOLEAN DEFAULT FALSE,
            grant_id TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `;

        // Create events table
        await sql`
          CREATE TABLE IF NOT EXISTS ${sql(this.tables.events)} (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            nylas_event_ids TEXT[] NOT NULL,
            nylas_calendar_ids TEXT[] NOT NULL,
            title TEXT,
            description TEXT,
            start_datetime TIMESTAMP WITH TIME ZONE,
            end_datetime TIMESTAMP WITH TIME ZONE,
            busy BOOLEAN DEFAULT TRUE,
            read_only BOOLEAN DEFAULT FALSE,
            grant_id TEXT NOT NULL,
            user_id UUID NOT NULL,
            when_object TEXT NOT NULL,
            location TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `;

        // Create indexes - each as a separate statement
        await sql`CREATE INDEX IF NOT EXISTS ${
          sql(
            `${this.tables.events}_user_id_idx`,
          )
        } ON ${sql(this.tables.events)}(user_id)`;

        await sql`CREATE INDEX IF NOT EXISTS ${
          sql(
            `${this.tables.events}_start_datetime_idx`,
          )
        } ON ${sql(this.tables.events)}(start_datetime)`;

        await sql`CREATE INDEX IF NOT EXISTS ${
          sql(
            `${this.tables.events}_end_datetime_idx`,
          )
        } ON ${sql(this.tables.events)}(end_datetime)`;

        await sql`CREATE INDEX IF NOT EXISTS ${
          sql(
            `${this.tables.calendars}_user_id_idx`,
          )
        } ON ${sql(this.tables.calendars)}(user_id)`;
      });

      this.logger.info("Tables created or verified successfully");
    } catch (error) {
      this.logger.error(this.formatError(error, "Failed to create tables"));
      throw new Error(this.formatError(error, "Failed to create tables"));
    }
  }

  /**
   * Disconnect from the database
   */
  async disconnect(): Promise<void> {
    try {
      await this.sql.end();
      this.isConnected = false;
      this.logger.info("PostgresAdapter disconnected");
      return Promise.resolve();
    } catch (error) {
      this.logger.error(this.formatError(error, "Failed to disconnect"));
      throw new Error(this.formatError(error, "Failed to disconnect"));
    }
  }

  /**
   * Store or update Nylas credentials for a user
   */
  async storeCredentials(
    userId: string,
    credentials: NylasCredentials,
  ): Promise<void> {
    await this.autoConnectIfNeeded();

    const credentialsRow = {
      user_id: userId,
      grant_id: credentials.grantId,
      access_token: credentials.accessToken,
      email: credentials.email,
      provider: credentials.provider,
      expires_at: credentials.expiresIn
        ? new Date(credentials.expiresIn * 1000).toISOString()
        : null,
      id_token: credentials.idToken || null,
      token_type: credentials.tokenType || null,
      scope: credentials.scope || null,
      grant_expired: false,
      updated_at: new Date().toISOString(),
    };

    try {
      // Check if credentials already exist
      const existingResult = await this.sql`
        SELECT user_id FROM ${
        this.sql(
          this.tables.credentials,
        )
      } WHERE user_id = ${userId}
      `;

      if (existingResult.length === 0) {
        // Insert new credentials
        await this.sql`
          INSERT INTO ${this.sql(this.tables.credentials)} ${
          this.sql(
            credentialsRow,
          )
        }
        `;

        this.logger.dbOperation(
          "insert",
          this.tables.credentials,
          credentialsRow,
        );
      } else {
        // Update existing credentials
        const { user_id, ...updateValues } = credentialsRow;

        await this.sql`
          UPDATE ${this.sql(this.tables.credentials)}
          SET ${this.sql(updateValues)}
          WHERE user_id = ${userId}
        `;

        this.logger.dbOperation(
          "update",
          this.tables.credentials,
          credentialsRow,
        );
      }
    } catch (error) {
      this.logger.error(this.formatError(error, "Failed to store credentials"));
      throw new Error(this.formatError(error, "Failed to store credentials"));
    }
  }

  /**
   * Get Nylas credentials for a user
   */
  async getCredentials(userId: string): Promise<NylasCredentials | null> {
    await this.autoConnectIfNeeded();

    try {
      const result = await this.sql`
        SELECT * FROM ${
        this.sql(
          this.tables.credentials,
        )
      } WHERE user_id = ${userId}
      `;

      if (result.length === 0) {
        this.logger.info(`No credentials found for user ${userId}`);
        return null;
      }

      const row = result[0];
      this.logger.dbOperation("select", this.tables.credentials, row);

      // Map from database schema to Nylas credentials
      const credentials: NylasCredentials = {
        grantId: row.grant_id,
        accessToken: row.access_token,
        email: row.email,
        provider: row.provider,
        expiresIn: row.expires_at
          ? Math.floor(new Date(row.expires_at).getTime() / 1000)
          : undefined,
        idToken: row.id_token,
        tokenType: row.token_type,
        scope: row.scope,
      };

      return credentials;
    } catch (error) {
      this.logger.error(this.formatError(error, "Failed to get credentials"));
      throw new Error(this.formatError(error, "Failed to get credentials"));
    }
  }

  /**
   * Delete Nylas credentials for a user
   */
  async deleteCredentials(userId: string): Promise<void> {
    await this.autoConnectIfNeeded();

    try {
      await this.sql`
        DELETE FROM ${
        this.sql(
          this.tables.credentials,
        )
      } WHERE user_id = ${userId}
      `;

      this.logger.dbOperation("delete", this.tables.credentials, { userId });
    } catch (error) {
      this.logger.error(
        this.formatError(error, "Failed to delete credentials"),
      );
      throw new Error(this.formatError(error, "Failed to delete credentials"));
    }

    return Promise.resolve();
  }

  /**
   * Store a calendar event
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
    await this.autoConnectIfNeeded();

    // Generate a unique ID if one is not provided
    const eventId = event.id || crypto.randomUUID();

    try {
      // Extract start and end times
      const { startDateTime, endDateTime } = this.extractDateTimeFromEvent(
        event,
      );

      const eventRow = {
        nylas_event_ids: [eventId],
        nylas_calendar_ids: [calendarId],
        title: event.title || null,
        description: event.description || null,
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        when_object: event.when.object || "timespan",
        location: event.location || null,
        busy: event.busy,
        read_only: event.readOnly,
        grant_id: event.grantId,
        user_id: userId,
      };

      const result = await this.sql`
        INSERT INTO ${this.sql(this.tables.events)} ${this.sql(eventRow)}
        RETURNING id
      `;

      const dbEventId = result[0].id;
      this.logger.dbOperation("insert", this.tables.events, {
        ...eventRow,
        id: dbEventId,
      });

      return eventId;
    } catch (error) {
      this.logger.error(this.formatError(error, "Failed to store event"));
      throw new Error(this.formatError(error, "Failed to store event"));
    }
  }

  /**
   * Update a calendar event
   */
  async updateEvent(
    eventId: string,
    eventData: Partial<NylasEvent>,
    options?: {
      notify?: boolean;
      participantIds?: string[];
    },
  ): Promise<void> {
    await this.autoConnectIfNeeded();

    try {
      // First check if the event exists
      const findResult = await this.sql`
        SELECT * FROM ${this.sql(this.tables.events)} 
        WHERE nylas_event_ids @> ARRAY[${eventId}]::text[]
      `;

      if (findResult.length === 0) {
        const error = `Event ${eventId} not found`;
        this.logger.error(error);
        throw new Error(error);
      }

      const existingEvent = findResult[0];

      // Prepare the update data
      const { startDateTime, endDateTime } = eventData.when
        ? this.extractDateTimeFromEvent(eventData as NylasEvent)
        : { startDateTime: null, endDateTime: null };

      const updateData: any = {};
      if (eventData.title !== undefined) updateData.title = eventData.title;
      if (eventData.description !== undefined) {
        updateData.description = eventData.description;
      }
      if (eventData.location !== undefined) {
        updateData.location = eventData.location;
      }
      if (startDateTime !== null) updateData.start_datetime = startDateTime;
      if (endDateTime !== null) updateData.end_datetime = endDateTime;
      if (eventData.busy !== undefined) updateData.busy = eventData.busy;
      if (eventData.readOnly !== undefined) {
        updateData.read_only = eventData.readOnly;
      }
      if (eventData.when?.object !== undefined) {
        updateData.when_object = eventData.when.object;
      }

      // Add updated timestamp
      updateData.updated_at = new Date().toISOString();

      // If there's nothing to update, return early
      if (Object.keys(updateData).length === 0) {
        this.logger.info(`No data to update for event ${eventId}`);
        return Promise.resolve();
      }

      await this.sql`
        UPDATE ${this.sql(this.tables.events)}
        SET ${this.sql(updateData)}
        WHERE id = ${existingEvent.id}
      `;

      this.logger.dbOperation("update", this.tables.events, {
        eventId,
        updateData,
      });
    } catch (error) {
      this.logger.error(this.formatError(error, "Failed to update event"));
      throw new Error(this.formatError(error, "Failed to update event"));
    }

    return Promise.resolve();
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(
    eventId: string,
    options?: {
      calendarId?: string;
      notify?: boolean;
    },
  ): Promise<void> {
    await this.autoConnectIfNeeded();

    try {
      // First find the event to ensure it exists
      const findResult = await this.sql`
        SELECT * FROM ${this.sql(this.tables.events)} 
        WHERE nylas_event_ids @> ARRAY[${eventId}]::text[]
      `;

      if (findResult.length === 0) {
        const error = `Event ${eventId} not found`;
        this.logger.error(error);
        throw new Error(error);
      }

      const existingEvent = findResult[0];

      // Delete the event
      await this.sql`
        DELETE FROM ${
        this.sql(
          this.tables.events,
        )
      } WHERE id = ${existingEvent.id}
      `;

      this.logger.dbOperation("delete", this.tables.events, {
        eventId,
        dbEventId: existingEvent.id,
      });
    } catch (error) {
      this.logger.error(this.formatError(error, "Failed to delete event"));
      throw new Error(this.formatError(error, "Failed to delete event"));
    }

    return Promise.resolve();
  }

  /**
   * Get a single event by ID
   */
  async getEvent(eventId: string): Promise<NylasEvent | null> {
    await this.autoConnectIfNeeded();

    try {
      const result = await this.sql`
        SELECT * FROM ${this.sql(this.tables.events)} 
        WHERE nylas_event_ids @> ARRAY[${eventId}]::text[]
      `;

      if (result.length === 0) {
        this.logger.info(`No event found with ID ${eventId}`);
        return null;
      }

      const row = result[0];
      this.logger.dbOperation("select", this.tables.events, row);

      return this.mapDbRowToNylasEvent(row);
    } catch (error) {
      this.logger.error(this.formatError(error, "Failed to get event"));
      throw new Error(this.formatError(error, "Failed to get event"));
    }
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
    await this.autoConnectIfNeeded();

    try {
      // Build the query conditionally based on filters
      const conditions: any[] = [];
      const params: any[] = [];

      if (filters?.userId) {
        conditions.push(`user_id = ${filters.userId}`);
      }

      if (filters?.calendarId) {
        conditions.push(
          `nylas_calendar_ids @> ARRAY[${filters.calendarId}]::text[]`,
        );
      }

      if (filters?.startTime) {
        const startDate = new Date(filters.startTime * 1000).toISOString();
        conditions.push(`end_datetime >= ${startDate}`);
      }

      if (filters?.endTime) {
        const endDate = new Date(filters.endTime * 1000).toISOString();
        conditions.push(`start_datetime <= ${endDate}`);
      }

      // Use dynamic SQL construction
      let query = this.sql`
        SELECT * FROM ${this.sql(this.tables.events)}
      `;

      // Add WHERE conditions if there are any
      if (conditions.length > 0) {
        query = this.sql`${query} WHERE ${this.sql(conditions.join(" AND "))}`;
      }

      // Add ORDER BY
      query = this.sql`${query} ORDER BY start_datetime ASC`;

      // Add LIMIT if specified
      if (filters?.limit && filters.limit > 0) {
        query = this.sql`${query} LIMIT ${filters.limit}`;
      }

      const result = await query;
      const events = result.map((row) => this.mapDbRowToNylasEvent(row));

      this.logger.dbOperation("query", this.tables.events, {
        filters,
        count: events.length,
        sample: events.length > 0 ? events[0].id : null,
      });

      return events;
    } catch (error) {
      this.logger.error(this.formatError(error, "Failed to get events"));
      throw new Error(this.formatError(error, "Failed to get events"));
    }
  }

  /**
   * Store calendar information
   */
  async storeCalendar(userId: string, calendar: NylasCalendar): Promise<void> {
    await this.autoConnectIfNeeded();

    try {
      const calendarRow = {
        id: calendar.id,
        user_id: userId,
        name: calendar.name,
        description: calendar.description || null,
        timezone: calendar.timezone || "UTC",
        hex_color: calendar.hexColor || null,
        hex_foreground_color: calendar.hexForegroundColor || null,
        is_primary: calendar.isPrimary || false,
        is_read_only: calendar.readOnly || false,
        is_owned_by_user: calendar.isOwnedByUser || false,
        grant_id: calendar.grantId,
        updated_at: new Date().toISOString(),
      };

      // Check if calendar already exists
      const existingResult = await this.sql`
        SELECT id FROM ${
        this.sql(
          this.tables.calendars,
        )
      } WHERE id = ${calendar.id}
      `;

      if (existingResult.length === 0) {
        // Insert new calendar
        await this.sql`
          INSERT INTO ${this.sql(this.tables.calendars)} ${
          this.sql(
            calendarRow,
          )
        }
        `;

        this.logger.dbOperation("insert", this.tables.calendars, calendarRow);
      } else {
        // Update existing calendar
        const { id, ...updateValues } = calendarRow;

        await this.sql`
          UPDATE ${this.sql(this.tables.calendars)}
          SET ${this.sql(updateValues)}
          WHERE id = ${calendar.id}
        `;

        this.logger.dbOperation("update", this.tables.calendars, calendarRow);
      }
    } catch (error) {
      this.logger.error(this.formatError(error, "Failed to store calendar"));
      throw new Error(this.formatError(error, "Failed to store calendar"));
    }

    return Promise.resolve();
  }

  /**
   * Get calendars for a user
   */
  async getCalendars(userId: string): Promise<NylasCalendar[]> {
    await this.autoConnectIfNeeded();

    try {
      const result = await this.sql`
        SELECT * FROM ${
        this.sql(
          this.tables.calendars,
        )
      } WHERE user_id = ${userId}
      `;

      const calendars = result.map((row) => this.mapDbRowToNylasCalendar(row));

      this.logger.dbOperation("query", this.tables.calendars, {
        userId,
        count: calendars.length,
        sample: calendars.length > 0 ? calendars[0].name : null,
      });

      return calendars;
    } catch (error) {
      this.logger.error(this.formatError(error, "Failed to get calendars"));
      throw new Error(this.formatError(error, "Failed to get calendars"));
    }
  }

  /**
   * Get calendar by ID
   */
  async getCalendar(calendarId: string): Promise<NylasCalendar | null> {
    await this.autoConnectIfNeeded();

    try {
      const result = await this.sql`
        SELECT * FROM ${
        this.sql(
          this.tables.calendars,
        )
      } WHERE id = ${calendarId}
      `;

      if (result.length === 0) {
        this.logger.info(`No calendar found with ID ${calendarId}`);
        return null;
      }

      const row = result[0];
      this.logger.dbOperation("select", this.tables.calendars, row);

      return this.mapDbRowToNylasCalendar(row);
    } catch (error) {
      this.logger.error(this.formatError(error, "Failed to get calendar"));
      throw new Error(this.formatError(error, "Failed to get calendar"));
    }
  }

  /**
   * Execute a custom query on the database
   */
  async executeQuery<R = any>(query: string, params?: any[]): Promise<R> {
    await this.autoConnectIfNeeded();

    try {
      // For custom queries, we need to use the unsafe method
      const result = await this.sql.unsafe(query, params || []);

      this.logger.dbOperation("custom", "query", {
        query,
        params,
        rowCount: result.length,
      });

      return result as R;
    } catch (error) {
      this.logger.error(this.formatError(error, "Failed to execute query"));
      throw new Error(this.formatError(error, "Failed to execute query"));
    }
  }

  /**
   * Mark a credential as expired
   */
  async markCredentialExpired(userId: string): Promise<void> {
    await this.autoConnectIfNeeded();

    try {
      await this.sql`
        UPDATE ${this.sql(this.tables.credentials)}
        SET grant_expired = TRUE,
            expires_at = ${new Date(0).toISOString()},
            updated_at = ${new Date().toISOString()}
        WHERE user_id = ${userId}
      `;

      this.logger.dbOperation("update", this.tables.credentials, {
        userId,
        action: "expired",
      });
    } catch (error) {
      this.logger.error(
        this.formatError(error, "Failed to mark credential as expired"),
      );
      throw new Error(
        this.formatError(error, "Failed to mark credential as expired"),
      );
    }

    return Promise.resolve();
  }

  /**
   * Check if a credential exists and is valid
   */
  async hasValidCredential(userId: string): Promise<boolean> {
    await this.autoConnectIfNeeded();

    try {
      const result = await this.sql`
        SELECT expires_at, grant_expired
        FROM ${this.sql(this.tables.credentials)}
        WHERE user_id = ${userId}
      `;

      if (result.length === 0) {
        this.logger.info(`No credentials found for user ${userId}`);
        return false;
      }

      const row = result[0];

      // If explicitly marked as expired, return false
      if (row.grant_expired) {
        this.logger.info(
          `Credentials for user ${userId} are marked as expired`,
        );
        return false;
      }

      // If no expiration is set, assume the credential is valid
      if (!row.expires_at) {
        this.logger.info(
          `Credentials for user ${userId} have no expiration, considered valid`,
        );
        return true;
      }

      // Check if the credential has expired
      const now = new Date();
      const expiresAt = new Date(row.expires_at);
      const isValid = now < expiresAt;

      this.logger.info(
        `Credentials for user ${userId} are ${isValid ? "valid" : "expired"}`,
      );
      return isValid;
    } catch (error) {
      this.logger.error(
        this.formatError(error, "Failed to check credential validity"),
      );
      throw new Error(
        this.formatError(error, "Failed to check credential validity"),
      );
    }
  }
}
