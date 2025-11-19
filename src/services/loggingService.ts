// services/loggingService.ts

interface LogContext {
  component?: string;
  [key: string]: any;
}

/**
 * Centralized client-side error logging service.
 */
export const logger = {
  /**
   * Logs an error to the console and sends it to the server for persistent logging.
   * @param error The error object.
   * @param context Additional context to help with debugging.
   */
  error: (error: Error, context?: LogContext): void => {
    // Log structured error to the browser console for immediate debugging
    console.error("[Logged Error]", {
      message: error.message,
      stack: error.stack,
      context,
    });

    // Asynchronously send the error to the server.
    // This is a "fire-and-forget" operation; we don't want logging to block the UI.
    fetch('/api/log-client-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        context: {
          ...context,
          url: window.location.href,
          userAgent: navigator.userAgent,
        },
      }),
    }).catch(logError => {
      // If sending the log fails, log that meta-error to the console.
      console.error("Failed to send error log to server:", logError);
    });
  },

  /**
   * Logs an informational message.
   * @param message The message string.
   * @param context Additional context.
   */
  info: (message: string, context?: LogContext): void => {
    console.log("[Info]", message, context);
  },
};
