/**
 * Structured logger for production use.
 * Wraps console methods with context and log levels.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = {
  requestId?: string;
  userId?: string;
  orderId?: string;
  [key: string]: unknown;
};

class Logger {
  private isDev = process.env.NODE_ENV === "development";

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
      ...(error && { error: { message: error.message, stack: error.stack } }),
    };

    // In production, you would send this to a logging service (Sentry, LogRocket, etc.)
    // For now, we'll use console with structured output
    switch (level) {
      case "debug":
        if (this.isDev) console.debug(JSON.stringify(logEntry));
        break;
      case "info":
        console.info(JSON.stringify(logEntry));
        break;
      case "warn":
        console.warn(JSON.stringify(logEntry));
        break;
      case "error":
        console.error(JSON.stringify(logEntry));
        break;
    }
  }

  debug(message: string, context?: LogContext) {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext) {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log("error", message, context, error);
  }
}

export const logger = new Logger();

/**
 * Generate a unique request ID for tracing
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
