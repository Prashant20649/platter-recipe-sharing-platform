package com.platter.exception;

/**
 * Exception thrown when a requested resource does not exist (HTTP 404).
 */
public class NotFoundException extends PlatterException {

    /**
     * Constructs a NotFoundException with an error message.
     *
     * @param message error description
     */
    public NotFoundException(String message) {
        super(404, message);
    }
}
