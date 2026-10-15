package com.platter.exception;

/**
 * Exception thrown when authentication credentials are required or invalid (HTTP 401).
 */
public class UnauthorizedException extends PlatterException {

    /**
     * Constructs an UnauthorizedException with an error message.
     *
     * @param message error description
     */
    public UnauthorizedException(String message) {
        super(401, message);
    }
}
