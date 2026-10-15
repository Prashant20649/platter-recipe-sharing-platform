package com.platter.servlet;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.platter.exception.ForbiddenException;
import com.platter.exception.NotFoundException;
import com.platter.exception.PlatterException;
import com.platter.exception.UnauthorizedException;
import com.platter.exception.ValidationException;
import com.platter.model.User;
import com.platter.util.JsonUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.IOException;

/**
 * Base abstract Jakarta Servlet providing common utility routines:
 * payload parsing, authenticated user context resolution, role assertions,
 * and centralized HTTP exception handling.
 */
public abstract class BaseServlet extends HttpServlet {

    protected final Logger logger = LoggerFactory.getLogger(getClass());
    protected final ObjectMapper mapper = JsonUtil.getMapper();

    /**
     * Resolves the authenticated {@link User} from the request attribute.
     *
     * @param req current HttpServletRequest
     * @return current User or null if unauthenticated
     */
    protected User getCurrentUser(HttpServletRequest req) {
        return (User) req.getAttribute("currentUser");
    }

    /**
     * Asserts that a valid authenticated user is present.
     *
     * @param req current HttpServletRequest
     * @return the authenticated User
     * @throws UnauthorizedException if no user is authenticated
     */
    protected User requireAuth(HttpServletRequest req) {
        User user = getCurrentUser(req);
        if (user == null) {
            throw new UnauthorizedException("Authentication required to access this resource.");
        }
        return user;
    }

    /**
     * Asserts that an authenticated user possesses administrator privileges.
     *
     * @param req current HttpServletRequest
     * @return the authenticated AdminUser
     * @throws UnauthorizedException if unauthenticated
     * @throws ForbiddenException    if user lacks administrator role
     */
    protected User requireAdmin(HttpServletRequest req) {
        User user = requireAuth(req);
        if (!user.canApproveRecipes()) {
            throw new ForbiddenException("Administrative access required.");
        }
        return user;
    }

    /**
     * Deserializes JSON request body into the specified class type.
     *
     * @param req   current HttpServletRequest
     * @param clazz target class
     * @param <T>   generic return type
     * @return parsed instance of T
     * @throws IOException on read or parse failure
     */
    protected <T> T parseRequestBody(HttpServletRequest req, Class<T> clazz) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        String body = sb.toString().trim();
        if (body.isEmpty()) {
            return null;
        }
        return mapper.readValue(body, clazz);
    }

    /**
     * Centralized exception translation converting application exceptions
     * into structured JSON responses with appropriate HTTP status codes.
     *
     * @param resp the HttpServletResponse
     * @param e    the caught exception
     */
    protected void handleException(HttpServletResponse resp, Exception e) {
        try {
            if (e instanceof ValidationException) {
                JsonUtil.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
            } else if (e instanceof UnauthorizedException) {
                JsonUtil.sendError(resp, HttpServletResponse.SC_UNAUTHORIZED, e.getMessage());
            } else if (e instanceof ForbiddenException) {
                JsonUtil.sendError(resp, HttpServletResponse.SC_FORBIDDEN, e.getMessage());
            } else if (e instanceof NotFoundException) {
                JsonUtil.sendError(resp, HttpServletResponse.SC_NOT_FOUND, e.getMessage());
            } else if (e instanceof PlatterException pe) {
                JsonUtil.sendError(resp, pe.getStatusCode(), pe.getMessage());
            } else {
                logger.error("Unhandled servlet exception: {}", e.getMessage(), e);
                JsonUtil.sendError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                        e.getMessage() != null ? e.getMessage() : "An unexpected server error occurred.");
            }
        } catch (IOException ioException) {
            logger.error("Failed to write error JSON response: {}", ioException.getMessage(), ioException);
        }
    }
}
