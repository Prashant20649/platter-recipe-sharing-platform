package com.platter.filter;

import com.platter.dao.UserDAO;
import com.platter.model.User;
import com.platter.util.JsonUtil;
import com.platter.util.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Optional;
import java.util.Set;

/**
 * Filter responsible for validating JWT credentials in cookies or Authorization headers
 * and populating the {@code currentUser} request attribute for downstream Servlets.
 */
@WebFilter(filterName = "AuthFilter", urlPatterns = "/api/*")
public class AuthFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(AuthFilter.class);
    private final UserDAO userDAO = new UserDAO();

    // Paths that strictly require authentication
    private static final Set<String> STRICT_PROTECTED_PREFIXES = Set.of(
            "/api/messages",
            "/api/collections",
            "/api/history",
            "/api/stats"
    );

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        // Skip OPTIONS
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(req, res);
            return;
        }

        String token = JwtUtil.extractToken(request);
        User currentUser = null;

        if (token != null) {
            try {
                Claims claims = JwtUtil.parseToken(token);
                Long userId = Long.valueOf(claims.getSubject());
                Optional<User> userOpt = userDAO.findById(userId);
                if (userOpt.isPresent()) {
                    currentUser = userOpt.get();
                    request.setAttribute("currentUser", currentUser);
                }
            } catch (Exception e) {
                logger.debug("JWT verification failed or expired: {}", e.getMessage());
            }
        }

        String uri = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isEmpty() && uri.startsWith(contextPath)) {
            uri = uri.substring(contextPath.length());
        }

        // Check if strict path requires authentication
        for (String prefix : STRICT_PROTECTED_PREFIXES) {
            if (uri.startsWith(prefix) && currentUser == null) {
                JsonUtil.sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required.");
                return;
            }
        }

        chain.doFilter(req, res);
    }
}
