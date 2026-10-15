package com.platter.exception;

/**
 * Exception thrown when an authenticated user lacks requisite role permissions (HTTP 403).
 */
public class ForbiddenException extends PlatterException {

    /**
     * Constructs a ForbiddenException with an error message.
     *
     * @param message error description
     */
    public ForbiddenException(String message) {
        super(403, message);
    }
}
