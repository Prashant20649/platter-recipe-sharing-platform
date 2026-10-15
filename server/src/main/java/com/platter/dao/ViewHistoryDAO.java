package com.platter.dao;

import com.platter.model.Recipe;
import com.platter.model.ViewHistoryItem;
import com.platter.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for {@link ViewHistoryItem} tracking user browsing history.
 */
public class ViewHistoryDAO {

    /**
     * Records or updates a user view timestamp for a recipe using MySQL ON DUPLICATE KEY UPDATE.
     *
     * @param userId   the viewing user
     * @param recipeId the viewed recipe
     * @throws SQLException on database error
     */
    public void recordView(Long userId, Long recipeId) throws SQLException {
        String sql = "INSERT INTO view_history (user_id, recipe_id, viewed_at) VALUES (?, ?, CURRENT_TIMESTAMP) " +
                     "ON DUPLICATE KEY UPDATE viewed_at = CURRENT_TIMESTAMP";

        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            ps.setLong(2, recipeId);
            ps.executeUpdate();
        }
    }

    /**
     * Retrieves recent browsing history for a user.
     *
     * @param userId the user ID
     * @return list of view history items with populated recipe details
     * @throws SQLException on database error
     */
    public List<ViewHistoryItem> getViewHistory(Long userId) throws SQLException {
        String sql = "SELECT vh.*, r.title as recipe_title, r.photo_url as recipe_photo, " +
                     "r.cuisine as recipe_cuisine, r.diet as recipe_diet, r.average_rating as recipe_rating, " +
                     "r.review_count as recipe_reviews, r.view_count as recipe_views, " +
                     "u.id as author_id, u.name as author_name, u.avatar as author_avatar " +
                     "FROM view_history vh " +
                     "JOIN recipes r ON vh.recipe_id = r.id " +
                     "JOIN users u ON r.author_id = u.id " +
                     "WHERE vh.user_id = ? " +
                     "ORDER BY vh.viewed_at DESC";

        List<ViewHistoryItem> list = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Recipe r = new Recipe();
                    r.setId(rs.getLong("recipe_id"));
                    r.setTitle(rs.getString("recipe_title"));
                    r.setPhotoUrl(rs.getString("recipe_photo"));
                    r.setCuisine(rs.getString("recipe_cuisine"));
                    r.setDiet(rs.getString("recipe_diet"));
                    r.setAverageRating(rs.getDouble("recipe_rating"));
                    r.setReviewCount(rs.getInt("recipe_reviews"));
                    r.setViewCount(rs.getInt("recipe_views"));
                    r.setAuthor(new Recipe.AuthorSummary(
                            rs.getLong("author_id"),
                            rs.getString("author_name"),
                            null,
                            rs.getString("author_avatar")
                    ));

                    ViewHistoryItem item = new ViewHistoryItem(
                            rs.getLong("id"),
                            rs.getLong("user_id"),
                            rs.getLong("recipe_id"),
                            r,
                            rs.getTimestamp("viewed_at")
                    );
                    list.add(item);
                }
            }
        }
        return list;
    }

    /**
     * Removes a single history entry for a user.
     */
    public boolean deleteHistoryItem(Long historyId, Long userId) throws SQLException {
        String sql = "DELETE FROM view_history WHERE id = ? AND user_id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, historyId);
            ps.setLong(2, userId);
            return ps.executeUpdate() > 0;
        }
    }

    /**
     * Clears all view history entries for a given user.
     */
    public boolean clearHistory(Long userId) throws SQLException {
        String sql = "DELETE FROM view_history WHERE user_id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            return ps.executeUpdate() >= 0;
        }
    }
}
