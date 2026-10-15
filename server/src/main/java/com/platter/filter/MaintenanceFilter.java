package com.platter.filter;

import com.platter.dao.SettingsDAO;
import com.platter.model.Settings;
import com.platter.model.User;
import com.platter.util.JsonUtil;
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Filter checking platform maintenance mode status.
 * Restricts platform traffic during maintenance while allowing administrative access.
 */
@WebFilter(filterName = "MaintenanceFilter", urlPatterns = "/api/*")
public class MaintenanceFilter implements Filter {

    private final SettingsDAO settingsDAO = new SettingsDAO();

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(req, res);
            return;
        }

        String uri = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isEmpty() && uri.startsWith(contextPath)) {
            uri = uri.substring(contextPath.length());
        }

        // Always allow public settings check and authentication endpoints
        if (uri.startsWith("/api/settings") || uri.startsWith("/api/auth")) {
            chain.doFilter(req, res);
            return;
        }

        try {
            Settings settings = settingsDAO.getSettings();
            if (settings.isMaintenanceMode()) {
                User currentUser = (User) request.getAttribute("currentUser");
                if (currentUser == null || !currentUser.canApproveRecipes()) {
                    JsonUtil.sendError(response, 503,
                            "Platter is currently undergoing scheduled maintenance. Please check back shortly.");
                    return;
                }
            }
        } catch (Exception ignored) {
        }

        chain.doFilter(req, res);
    }
}
