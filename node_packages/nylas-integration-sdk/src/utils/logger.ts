/**
 * Logger utility for pretty printing database operations
 */

export enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG",
}

interface LoggerOptions {
  module: string;
  level?: LogLevel;
  enabled?: boolean;
  prettyPrint?: boolean;
}

export class Logger {
  private module: string;
  private level: LogLevel;
  private enabled: boolean;
  private prettyPrint: boolean;

  constructor(options: LoggerOptions) {
    this.module = options.module;
    this.level = options.level || LogLevel.INFO;
    this.enabled = options.enabled !== undefined ? options.enabled : true;
    this.prettyPrint =
      options.prettyPrint !== undefined ? options.prettyPrint : true;
  }

  /**
   * Log an error message
   */
  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log an info message
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log a debug message
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log a database operation with pretty formatting
   */
  dbOperation(operation: string, table: string, data: any): void {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString();
    const emoji = this.getOperationEmoji(operation);

    console.log("\n" + "🔷".repeat(25));
    console.log(
      `[${timestamp}] ${this.module} | ${emoji} DATABASE ${operation.toUpperCase()}`,
    );
    console.log(`📊 Table: ${table}`);
    console.log("-".repeat(50));

    if (this.prettyPrint) {
      try {
        // For large objects, limit what we display
        const simplifiedData = this.simplifyDataForLogging(data);
        console.log(JSON.stringify(simplifiedData, null, 2));
      } catch (e) {
        console.log("Data could not be stringified:", data);
      }
    } else {
      console.log(data);
    }
    console.log("🔷".repeat(25) + "\n");
  }

  /**
   * Get an emoji for operation type to make logs more readable
   */
  private getOperationEmoji(operation: string): string {
    switch (operation.toLowerCase()) {
      case "insert":
        return "➕";
      case "update":
        return "✏️";
      case "delete":
        return "🗑️";
      case "select":
        return "🔍";
      case "query":
        return "🔎";
      case "custom":
        return "⚙️";
      default:
        return "📝";
    }
  }

  /**
   * Simplify data for logging by limiting large fields
   */
  private simplifyDataForLogging(data: any): any {
    if (!data || typeof data !== "object") {
      return data;
    }

    // Create a copy to modify
    const result = Array.isArray(data) ? [...data] : { ...data };

    // Handle objects and arrays
    for (const key in result) {
      if (typeof result[key] === "string" && result[key].length > 200) {
        // Truncate long strings
        result[key] = result[key].substring(0, 197) + "...";
      } else if (Array.isArray(result[key]) && result[key].length > 5) {
        // Summarize long arrays
        result[key] = [
          ...result[key].slice(0, 3),
          `... ${result[key].length - 3} more items`,
        ];
      } else if (typeof result[key] === "object" && result[key] !== null) {
        // Recursively simplify nested objects
        result[key] = this.simplifyDataForLogging(result[key]);
      }
    }

    return result;
  }

  /**
   * Generic log method
   */
  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.enabled) return;

    // Check if we should log based on level
    const levels = Object.values(LogLevel);
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);

    if (messageLevelIndex > currentLevelIndex) return;

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${this.module} | ${level} | ${message}`);

    if (data !== undefined) {
      if (this.prettyPrint) {
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log(data);
      }
    }
  }
}

/**
 * Create a database logger
 */
export function createDbLogger(
  module: string,
  options?: Partial<LoggerOptions>,
): Logger {
  return new Logger({
    module,
    level: options?.level || LogLevel.INFO,
    enabled: options?.enabled !== undefined ? options?.enabled : true,
    prettyPrint:
      options?.prettyPrint !== undefined ? options?.prettyPrint : true,
  });
}
