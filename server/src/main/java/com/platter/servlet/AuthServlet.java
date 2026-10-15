package com.platter.servlet;

import com.fasterxml.jackson.databind.JsonNode;
import com.platter.model.User;
import com.platter.service.UserService;
import com.platter.util.JsonUtil;
import com.platter.util.JwtUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;

/**
 * Servlet handling user authentication flows: registration, credential login,
 * session invalidation (logout), and identity verification (/me).
 * Sets and clears httpOnly JWT authentication cookies.
 */
@WebServlet(name = "AuthServlet", urlPatterns = "/api/auth/*")
public class AuthServlet extends BaseServlet {

    private final UserService userService = new UserService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null || "/me".equals(pathInfo)) {
            handleMe(req, resp);
        } else {
            JsonUtil.sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Auth endpoint not found: " + pathInfo);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        try {
            switch (pathInfo) {
                case "/login" -> handleLogin(req, resp);
                case "/register" -> handleRegister(req, resp);
                case "/logout" -> handleLogout(req, resp);
                default -> JsonUtil.sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Auth endpoint not found: " + pathInfo);
            }
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    private void handleLogin(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        JsonNode root = parseRequestBody(req, JsonNode.class);
        if (root == null) {
            JsonUtil.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Missing login credentials.");
            return;
        }

        String email = root.has("email") ? root.get("email").asText() : "";
        String password = root.has("password") ? root.get("password").asText() : "";

        User user = userService.login(email, password);
        String token = JwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());
        setAuthCookie(resp, token, 7 * 24 * 60 * 60);

        JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                "message", "Welcome back, " + user.getName() + "!",
                "user", user,
                "token", token
        ));
    }

    private void handleRegister(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        JsonNode root = parseRequestBody(req, JsonNode.class);
        if (root == null) {
            JsonUtil.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Missing registration payload.");
            return;
        }

        String name = root.has("name") ? root.get("name").asText() : "";
        String email = root.has("email") ? root.get("email").asText() : "";
        String password = root.has("password") ? root.get("password").asText() : "";
        String role = root.has("role") ? root.get("role").asText() : "explorer";
        String bio = root.has("bio") ? root.get("bio").asText() : "";

        User user = userService.register(name, email, password, role, bio);
        String token = JwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());
        setAuthCookie(resp, token, 7 * 24 * 60 * 60);

        JsonUtil.sendJson(resp, HttpServletResponse.SC_CREATED, Map.of(
                "message", "Registration successful! Welcome to Platter.",
                "user", user,
                "token", token
        ));
    }

    private void handleLogout(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        setAuthCookie(resp, "", 0);
        JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                "message", "Logged out successfully."
        ));
    }

    private void handleMe(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        User user = getCurrentUser(req);
        if (user == null) {
            JsonUtil.sendError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Not authenticated.");
            return;
        }
        JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                "user", user
        ));
    }

    private void setAuthCookie(HttpServletResponse resp, String token, int maxAge) {
        Cookie cookie = new Cookie("token", token);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(maxAge);
        cookie.setAttribute("SameSite", "Lax");
        resp.addCookie(cookie);
    }
}
