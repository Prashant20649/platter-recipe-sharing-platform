package com.platter.exception;

/**
 * Exception thrown when user input violates validation constraints (HTTP 400).
 */
public class ValidationException extends PlatterException {

    /**
     * Constructs a ValidationException with a descriptive error message.
     *
     * @param message error description
     */
    public ValidationException(String message) {
        super(400, message);
    }
}
