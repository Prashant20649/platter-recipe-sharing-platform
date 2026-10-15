package com.platter.servlet;

import com.fasterxml.jackson.databind.JsonNode;
import com.platter.model.Recipe;
import com.platter.model.User;
import com.platter.service.RecipeService;
import com.platter.service.UserService;
import com.platter.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Servlet handling user administration, personal profile updates,
 * and recipe favorite toggles.
 */
@WebServlet(name = "UserServlet", urlPatterns = "/api/users/*")
public class UserServlet extends BaseServlet {

    private final UserService userService = new UserService();
    private final RecipeService recipeService = new RecipeService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        try {
            if (pathInfo.isEmpty() || "/".equals(pathInfo)) {
                // List all users
                List<User> users = userService.getAllUsers();
                JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of("users", users));
            } else if ("/favorites".equals(pathInfo)) {
                // Get user favorite recipes
                User currentUser = requireAuth(req);
                List<Long> favIds = currentUser.getFavorites();
                List<Recipe> favRecipes = new ArrayList<>();
                for (Long id : favIds) {
                    try {
                        favRecipes.add(recipeService.getRecipeById(id));
                    } catch (Exception ignored) {
                    }
                }
                JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of("favorites", favRecipes));
            } else {
                // Get specific user by ID
                Long userId = Long.valueOf(pathInfo.substring(1));
                User user = userService.getUserById(userId);
                JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of("user", user));
            }
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        try {
            if (pathInfo.startsWith("/favorites/")) {
                // Toggle favorite: /api/users/favorites/:recipeId
                User currentUser = requireAuth(req);
                Long recipeId = Long.valueOf(pathInfo.substring("/favorites/".length()));
                boolean favorited = userService.toggleFavorite(currentUser.getId(), recipeId);
                String msg = favorited ? "Recipe saved to your favorites!" : "Recipe removed from favorites.";
                JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                        "message", msg,
                        "favorited", favorited
                ));
            } else if (pathInfo.isEmpty() || "/".equals(pathInfo)) {
                // Admin creates user
                User admin = requireAdmin(req);
                JsonNode root = parseRequestBody(req, JsonNode.class);
                String name = root.has("name") ? root.get("name").asText() : "";
                String email = root.has("email") ? root.get("email").asText() : "";
                String password = root.has("password") ? root.get("password").asText() : "password123";
                String role = root.has("role") ? root.get("role").asText() : "explorer";
                String bio = root.has("bio") ? root.get("bio").asText() : "";

                User created = userService.register(name, email, password, role, bio);
                JsonUtil.sendJson(resp, HttpServletResponse.SC_CREATED, Map.of(
                        "message", "User created successfully by admin.",
                        "user", created
                ));
            } else {
                JsonUtil.sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found: " + pathInfo);
            }
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        try {
            User currentUser = requireAuth(req);
            JsonNode root = parseRequestBody(req, JsonNode.class);

            if ("/profile".equals(pathInfo)) {
                // Update profile
                String name = root.has("name") ? root.get("name").asText() : null;
                String email = root.has("email") ? root.get("email").asText() : null;
                String bio = root.has("bio") ? root.get("bio").asText() : null;
                String avatar = root.has("avatar") ? root.get("avatar").asText() : null;

                User updated = userService.updateUser(currentUser.getId(), name, email, null, bio, avatar, currentUser);
                JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                        "message", "Profile updated successfully!",
                        "user", updated
                ));
            } else if (pathInfo.startsWith("/")) {
                // Admin updates user: /api/users/:id
                Long targetId = Long.valueOf(pathInfo.substring(1));
                String name = root.has("name") ? root.get("name").asText() : null;
                String email = root.has("email") ? root.get("email").asText() : null;
                String role = root.has("role") ? root.get("role").asText() : null;
                String bio = root.has("bio") ? root.get("bio").asText() : null;
                String avatar = root.has("avatar") ? root.get("avatar").asText() : null;

                User updated = userService.updateUser(targetId, name, email, role, bio, avatar, currentUser);
                JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                        "message", "User updated successfully.",
                        "user", updated
                ));
            }
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        try {
            User admin = requireAdmin(req);
            Long targetId = Long.valueOf(pathInfo.substring(1));
            userService.deleteUser(targetId, admin);
            JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                    "message", "User deleted successfully."
            ));
        } catch (Exception e) {
            handleException(resp, e);
        }
    }
}
