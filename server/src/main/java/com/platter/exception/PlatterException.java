package com.platter.exception;

/**
 * Base custom unchecked exception for the Platter application.
 * Encapsulates an HTTP status code for centralized servlet error translation.
 */
public class PlatterException extends RuntimeException {

    private final int statusCode;

    /**
     * Constructs a PlatterException with an HTTP status code and message.
     *
     * @param statusCode HTTP status code
     * @param message    human-readable error description
     */
    public PlatterException(int statusCode, String message) {
        super(message);
        this.statusCode = statusCode;
    }

    /**
     * Constructs a PlatterException with an HTTP status code, message, and root cause.
     *
     * @param statusCode HTTP status code
     * @param message    human-readable error description
     * @param cause      underlying exception
     */
    public PlatterException(int statusCode, String message, Throwable cause) {
        super(message, cause);
        this.statusCode = statusCode;
    }

    /**
     * Returns the HTTP status code corresponding to this exception.
     *
     * @return HTTP status code integer
     */
    public int getStatusCode() {
        return statusCode;
    }
}
