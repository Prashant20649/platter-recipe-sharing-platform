package com.platter.servlet;

import com.fasterxml.jackson.databind.JsonNode;
import com.platter.model.Review;
import com.platter.model.User;
import com.platter.service.ReviewService;
import com.platter.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Servlet handling recipe reviews, ratings, user feedback management,
 * and administrative content moderation.
 */
@WebServlet(name = "ReviewServlet", urlPatterns = "/api/reviews/*")
public class ReviewServlet extends BaseServlet {

    private final ReviewService reviewService = new ReviewService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        try {
            if (pathInfo.startsWith("/recipe/")) {
                // Reviews for a recipe: /api/reviews/recipe/:recipeId
                Long recipeId = Long.valueOf(pathInfo.substring("/recipe/".length()));
                List<Review> reviews = reviewService.getRecipeReviews(recipeId);
                JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of("reviews", reviews));
            } else if ("/my".equals(pathInfo)) {
                // Current user's reviews: /api/reviews/my
                User currentUser = requireAuth(req);
                List<Review> reviews = reviewService.getUserReviews(currentUser.getId());
                JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of("reviews", reviews));
            } else if ("/admin/all".equals(pathInfo) || pathInfo.isEmpty() || "/".equals(pathInfo)) {
                // Admin moderation: /api/reviews/admin/all
                requireAdmin(req);
                List<Review> reviews = reviewService.getAllReviews();
                JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of("reviews", reviews));
            } else {
                JsonUtil.sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found: " + pathInfo);
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
            User currentUser = requireAuth(req);
            Long recipeId;

            if (pathInfo.startsWith("/recipe/")) {
                recipeId = Long.valueOf(pathInfo.substring("/recipe/".length()));
            } else {
                JsonNode root = parseRequestBody(req, JsonNode.class);
                recipeId = root.has("recipeId") ? root.get("recipeId").asLong() : null;
            }

            JsonNode root = parseRequestBody(req, JsonNode.class);
            int rating = root != null && root.has("rating") ? root.get("rating").asInt() : 5;
            String comment = root != null && root.has("comment") ? root.get("comment").asText() : "";

            Review review = reviewService.submitReview(recipeId, rating, comment, currentUser);
            JsonUtil.sendJson(resp, HttpServletResponse.SC_CREATED, Map.of(
                    "message", "Review submitted successfully!",
                    "review", review
            ));
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.isEmpty()) {
            JsonUtil.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Missing review identifier.");
            return;
        }

        try {
            User currentUser = requireAuth(req);
            Long reviewId = Long.valueOf(pathInfo.substring(1));

            JsonNode root = parseRequestBody(req, JsonNode.class);
            int rating = root != null && root.has("rating") ? root.get("rating").asInt() : 5;
            String comment = root != null && root.has("comment") ? root.get("comment").asText() : "";

            Review updated = reviewService.updateReview(reviewId, rating, comment, currentUser);
            JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                    "message", "Review updated successfully!",
                    "review", updated
            ));
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.isEmpty()) {
            JsonUtil.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Missing review identifier.");
            return;
        }

        try {
            User currentUser = requireAuth(req);
            Long reviewId = Long.valueOf(pathInfo.substring(1));
            reviewService.deleteReview(reviewId, currentUser);

            JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                    "message", "Review deleted successfully."
            ));
        } catch (Exception e) {
            handleException(resp, e);
        }
    }
}
