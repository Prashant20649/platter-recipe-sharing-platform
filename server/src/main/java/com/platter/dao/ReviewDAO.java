package com.platter.dao;

import com.platter.model.Review;
import com.platter.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Data Access Object for {@link Review} entities.
 * Handles review persistence, user and recipe association, rating constraint enforcement,
 * and average rating calculation.
 */
public class ReviewDAO implements BaseDAO<Review> {

    @Override
    public Optional<Review> findById(Long id) throws SQLException {
        String sql = "SELECT rev.*, u.name as user_name, u.avatar as user_avatar, u.email as user_email, " +
                     "r.title as recipe_title, r.photo_url as recipe_photo " +
                     "FROM reviews rev " +
                     "JOIN users u ON rev.user_id = u.id " +
                     "JOIN recipes r ON rev.recipe_id = r.id " +
                     "WHERE rev.id = ?";

        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToReview(rs));
                }
            }
        }
        return Optional.empty();
    }

    @Override
    public List<Review> findAll() throws SQLException {
        String sql = "SELECT rev.*, u.name as user_name, u.avatar as user_avatar, u.email as user_email, " +
                     "r.title as recipe_title, r.photo_url as recipe_photo " +
                     "FROM reviews rev " +
                     "JOIN users u ON rev.user_id = u.id " +
                     "JOIN recipes r ON rev.recipe_id = r.id " +
                     "ORDER BY rev.created_at DESC";

        List<Review> reviews = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                reviews.add(mapRowToReview(rs));
            }
        }
        return reviews;
    }

    /**
     * Finds all reviews for a particular recipe.
     *
     * @param recipeId the recipe ID
     * @return list of reviews sorted newest first
     * @throws SQLException on database error
     */
    public List<Review> findByRecipeId(Long recipeId) throws SQLException {
        String sql = "SELECT rev.*, u.name as user_name, u.avatar as user_avatar, u.email as user_email, " +
                     "r.title as recipe_title, r.photo_url as recipe_photo " +
                     "FROM reviews rev " +
                     "JOIN users u ON rev.user_id = u.id " +
                     "JOIN recipes r ON rev.recipe_id = r.id " +
                     "WHERE rev.recipe_id = ? " +
                     "ORDER BY rev.created_at DESC";

        List<Review> reviews = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, recipeId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    reviews.add(mapRowToReview(rs));
                }
            }
        }
        return reviews;
    }

    /**
     * Finds all reviews written by a particular user.
     *
     * @param userId the user ID
     * @return list of reviews
     * @throws SQLException on database error
     */
    public List<Review> findByUserId(Long userId) throws SQLException {
        String sql = "SELECT rev.*, u.name as user_name, u.avatar as user_avatar, u.email as user_email, " +
                     "r.title as recipe_title, r.photo_url as recipe_photo " +
                     "FROM reviews rev " +
                     "JOIN users u ON rev.user_id = u.id " +
                     "JOIN recipes r ON rev.recipe_id = r.id " +
                     "WHERE rev.user_id = ? " +
                     "ORDER BY rev.created_at DESC";

        List<Review> reviews = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    reviews.add(mapRowToReview(rs));
                }
            }
        }
        return reviews;
    }

    /**
     * Checks if a user already submitted a review for a given recipe.
     */
    public Optional<Review> findByUserAndRecipe(Long userId, Long recipeId) throws SQLException {
        String sql = "SELECT rev.*, u.name as user_name, u.avatar as user_avatar, u.email as user_email, " +
                     "r.title as recipe_title, r.photo_url as recipe_photo " +
                     "FROM reviews rev " +
                     "JOIN users u ON rev.user_id = u.id " +
                     "JOIN recipes r ON rev.recipe_id = r.id " +
                     "WHERE rev.user_id = ? AND rev.recipe_id = ?";

        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            ps.setLong(2, recipeId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToReview(rs));
                }
            }
        }
        return Optional.empty();
    }

    @Override
    public Review save(Review review) throws SQLException {
        String sql = "INSERT INTO reviews (user_id, recipe_id, rating, comment) VALUES (?, ?, ?, ?)";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, review.getUserId());
            ps.setLong(2, review.getRecipeId());
            ps.setInt(3, review.getRating());
            ps.setString(4, review.getComment());
            ps.executeUpdate();

            try (ResultSet generatedKeys = ps.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    review.setId(generatedKeys.getLong(1));
                }
            }
        }
        recalculateAverageRating(review.getRecipeId());
        return review;
    }

    @Override
    public boolean update(Review review) throws SQLException {
        String sql = "UPDATE reviews SET rating = ?, comment = ? WHERE id = ?";
        boolean updated;
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, review.getRating());
            ps.setString(2, review.getComment());
            ps.setLong(3, review.getId());
            updated = ps.executeUpdate() > 0;
        }
        if (updated && review.getRecipeId() != null) {
            recalculateAverageRating(review.getRecipeId());
        }
        return updated;
    }

    @Override
    public boolean deleteById(Long id) throws SQLException {
        Optional<Review> revOpt = findById(id);
        if (revOpt.isEmpty()) return false;
        Long recipeId = revOpt.get().getRecipeId();

        String sql = "DELETE FROM reviews WHERE id = ?";
        boolean deleted;
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            deleted = ps.executeUpdate() > 0;
        }
        if (deleted && recipeId != null) {
            recalculateAverageRating(recipeId);
        }
        return deleted;
    }

    /**
     * Recalculates average rating and review count for a recipe in the database.
     *
     * @param recipeId the recipe ID
     * @throws SQLException on error
     */
    public void recalculateAverageRating(Long recipeId) throws SQLException {
        String sql = "SELECT COALESCE(AVG(rating), 0.0) as avg_rating, COUNT(*) as rev_count " +
                     "FROM reviews WHERE recipe_id = ?";

        double avgRating = 0.0;
        int revCount = 0;

        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, recipeId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    avgRating = rs.getDouble("avg_rating");
                    revCount = rs.getInt("rev_count");
                }
            }

            // Round to 1 decimal place
            avgRating = Math.round(avgRating * 10.0) / 10.0;

            String updateSql = "UPDATE recipes SET average_rating = ?, review_count = ? WHERE id = ?";
            try (PreparedStatement updatePs = conn.prepareStatement(updateSql)) {
                updatePs.setDouble(1, avgRating);
                updatePs.setInt(2, revCount);
                updatePs.setLong(3, recipeId);
                updatePs.executeUpdate();
            }
        }
    }

    private Review mapRowToReview(ResultSet rs) throws SQLException {
        Review rev = new Review(
                rs.getLong("id"),
                rs.getLong("user_id"),
                rs.getLong("recipe_id"),
                rs.getInt("rating"),
                rs.getString("comment"),
                rs.getTimestamp("created_at"),
                rs.getTimestamp("updated_at")
        );

        rev.setUser(new Review.UserSummary(
                rs.getLong("user_id"),
                rs.getString("user_name"),
                rs.getString("user_avatar"),
                rs.getString("user_email")
        ));

        rev.setRecipe(new Review.RecipeSummary(
                rs.getLong("recipe_id"),
                rs.getString("recipe_title"),
                rs.getString("recipe_photo")
        ));

        return rev;
    }
}
