package com.platter.servlet;

import com.fasterxml.jackson.databind.JsonNode;
import com.platter.model.Collection;
import com.platter.model.User;
import com.platter.service.CollectionService;
import com.platter.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Servlet handling personal recipe collections and bookmark organization.
 */
@WebServlet(name = "CollectionServlet", urlPatterns = "/api/collections/*")
public class CollectionServlet extends BaseServlet {

    private final CollectionService collectionService = new CollectionService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            User currentUser = requireAuth(req);
            List<Collection> collections = collectionService.getUserCollections(currentUser.getId());
            JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of("collections", collections));
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        try {
            User currentUser = requireAuth(req);

            if (pathInfo.contains("/recipes/")) {
                // POST /api/collections/:collectionId/recipes/:recipeId
                String[] parts = pathInfo.split("/");
                // parts: ["", "collectionId", "recipes", "recipeId"]
                Long collectionId = Long.valueOf(parts[1]);
                Long recipeId = Long.valueOf(parts[3]);

                collectionService.addRecipeToCollection(collectionId, recipeId, currentUser.getId());
                JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                        "message", "Recipe added to collection successfully!"
                ));
            } else {
                // POST /api/collections
                JsonNode root = parseRequestBody(req, JsonNode.class);
                String name = root != null && root.has("name") ? root.get("name").asText() : "";
                String desc = root != null && root.has("description") ? root.get("description").asText() : "";

                Collection created = collectionService.createCollection(name, desc, currentUser.getId());
                JsonUtil.sendJson(resp, HttpServletResponse.SC_CREATED, Map.of(
                        "message", "Collection created successfully!",
                        "collection", created
                ));
            }
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.isEmpty()) {
            JsonUtil.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Missing collection identifier.");
            return;
        }

        try {
            User currentUser = requireAuth(req);
            Long collectionId = Long.valueOf(pathInfo.substring(1));

            JsonNode root = parseRequestBody(req, JsonNode.class);
            String name = root != null && root.has("name") ? root.get("name").asText() : "";
            String desc = root != null && root.has("description") ? root.get("description").asText() : null;

            Collection updated = collectionService.updateCollection(collectionId, name, desc, currentUser.getId());
            JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                    "message", "Collection updated successfully!",
                    "collection", updated
            ));
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.isEmpty()) {
            JsonUtil.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Missing collection identifier.");
            return;
        }

        try {
            User currentUser = requireAuth(req);

            if (pathInfo.contains("/recipes/")) {
                // DELETE /api/collections/:collectionId/recipes/:recipeId
                String[] parts = pathInfo.split("/");
                Long collectionId = Long.valueOf(parts[1]);
                Long recipeId = Long.valueOf(parts[3]);

                collectionService.removeRecipeFromCollection(collectionId, recipeId, currentUser.getId());
                JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                        "message", "Recipe removed from collection."
                ));
            } else {
                // DELETE /api/collections/:id
                Long collectionId = Long.valueOf(pathInfo.substring(1));
                collectionService.deleteCollection(collectionId, currentUser.getId());
                JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                        "message", "Collection deleted successfully."
                ));
            }
        } catch (Exception e) {
            handleException(resp, e);
        }
    }
}
