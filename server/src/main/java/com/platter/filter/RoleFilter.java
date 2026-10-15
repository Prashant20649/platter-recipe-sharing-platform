package com.platter.filter;

import com.platter.model.User;
import com.platter.util.JsonUtil;
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Filter enforcing Role-Based Access Control (RBAC) across protected administrative
 * and contributor API paths.
 */
@WebFilter(filterName = "RoleFilter", urlPatterns = "/api/*")
public class RoleFilter implements Filter {

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

        String uri = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isEmpty() && uri.startsWith(contextPath)) {
            uri = uri.substring(contextPath.length());
        }

        User currentUser = (User) request.getAttribute("currentUser");

        // Paths requiring Admin role
        if (uri.startsWith("/api/admin")) {
            if (currentUser == null) {
                JsonUtil.sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required.");
                return;
            }
            if (!currentUser.canApproveRecipes()) {
                JsonUtil.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Access forbidden: Administrator privileges required.");
                return;
            }
        }

        chain.doFilter(req, res);
    }
}
