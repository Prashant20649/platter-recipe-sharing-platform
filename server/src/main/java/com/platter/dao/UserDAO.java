package com.platter.dao;

import com.platter.model.User;
import com.platter.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Data Access Object for {@link User} entities.
 * Implements {@link BaseDAO} using raw JDBC PreparedStatements, connection pooling,
 * and try-with-resources for deterministic resource management.
 */
public class UserDAO implements BaseDAO<User> {

    @Override
    public Optional<User> findById(Long id) throws SQLException {
        String sql = "SELECT id, name, email, password, role, bio, avatar, created_at, updated_at " +
                     "FROM users WHERE id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    User user = mapRowToUser(rs);
                    user.setFavorites(getFavorites(conn, user.getId()));
                    return Optional.of(user);
                }
            }
        }
        return Optional.empty();
    }

    /**
     * Finds a user by their unique email address.
     *
     * @param email the user's email
     * @return an {@link Optional} containing the found user, or empty
     * @throws SQLException on database error
     */
    public Optional<User> findByEmail(String email) throws SQLException {
        String sql = "SELECT id, name, email, password, role, bio, avatar, created_at, updated_at " +
                     "FROM users WHERE email = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    User user = mapRowToUser(rs);
                    user.setFavorites(getFavorites(conn, user.getId()));
                    return Optional.of(user);
                }
            }
        }
        return Optional.empty();
    }

    @Override
    public List<User> findAll() throws SQLException {
        String sql = "SELECT id, name, email, password, role, bio, avatar, created_at, updated_at " +
                     "FROM users ORDER BY id ASC";
        List<User> users = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                User user = mapRowToUser(rs);
                user.setFavorites(getFavorites(conn, user.getId()));
                users.add(user);
            }
        }
        return users;
    }

    @Override
    public User save(User user) throws SQLException {
        String sql = "INSERT INTO users (name, email, password, role, bio, avatar) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, user.getName());
            ps.setString(2, user.getEmail());
            ps.setString(3, user.getPassword());
            ps.setString(4, user.getRole());
            ps.setString(5, user.getBio() != null ? user.getBio() : "");
            ps.setString(6, user.getAvatar() != null ? user.getAvatar() :
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80");
            ps.executeUpdate();

            try (ResultSet generatedKeys = ps.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    user.setId(generatedKeys.getLong(1));
                }
            }
        }
        return user;
    }

    @Override
    public boolean update(User user) throws SQLException {
        String sql = "UPDATE users SET name = ?, email = ?, role = ?, bio = ?, avatar = ? WHERE id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, user.getName());
            ps.setString(2, user.getEmail());
            ps.setString(3, user.getRole());
            ps.setString(4, user.getBio());
            ps.setString(5, user.getAvatar());
            ps.setLong(6, user.getId());
            return ps.executeUpdate() > 0;
        }
    }

    /**
     * Updates an existing user's password hash.
     *
     * @param userId         the user ID
     * @param hashedPassword the newly hashed password
     * @return true if updated, false otherwise
     * @throws SQLException on database error
     */
    public boolean updatePassword(Long userId, String hashedPassword) throws SQLException {
        String sql = "UPDATE users SET password = ? WHERE id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, hashedPassword);
            ps.setLong(2, userId);
            return ps.executeUpdate() > 0;
        }
    }

    @Override
    public boolean deleteById(Long id) throws SQLException {
        String sql = "DELETE FROM users WHERE id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    /**
     * Retrieves favorite recipe IDs for a specific user.
     *
     * @param userId the user identifier
     * @return list of favorite recipe IDs
     * @throws SQLException on database error
     */
    public List<Long> getFavorites(Long userId) throws SQLException {
        try (Connection conn = DBConnection.getInstance().getConnection()) {
            return getFavorites(conn, userId);
        }
    }

    /**
     * Helper to fetch favorites using an existing connection.
     */
    private List<Long> getFavorites(Connection conn, Long userId) throws SQLException {
        String sql = "SELECT recipe_id FROM user_favorites WHERE user_id = ?";
        List<Long> favorites = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    favorites.add(rs.getLong("recipe_id"));
                }
            }
        }
        return favorites;
    }

    /**
     * Toggles a recipe favorite state for a given user.
     *
     * @param userId   the user ID
     * @param recipeId the recipe ID
     * @return true if now favorited, false if removed from favorites
     * @throws SQLException on database error
     */
    public boolean toggleFavorite(Long userId, Long recipeId) throws SQLException {
        String checkSql = "SELECT 1 FROM user_favorites WHERE user_id = ? AND recipe_id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection()) {
            boolean exists = false;
            try (PreparedStatement checkPs = conn.prepareStatement(checkSql)) {
                checkPs.setLong(1, userId);
                checkPs.setLong(2, recipeId);
                try (ResultSet rs = checkPs.executeQuery()) {
                    exists = rs.next();
                }
            }

            if (exists) {
                String deleteSql = "DELETE FROM user_favorites WHERE user_id = ? AND recipe_id = ?";
                try (PreparedStatement delPs = conn.prepareStatement(deleteSql)) {
                    delPs.setLong(1, userId);
                    delPs.setLong(2, recipeId);
                    delPs.executeUpdate();
                }
                return false;
            } else {
                String insertSql = "INSERT INTO user_favorites (user_id, recipe_id) VALUES (?, ?)";
                try (PreparedStatement insPs = conn.prepareStatement(insertSql)) {
                    insPs.setLong(1, userId);
                    insPs.setLong(2, recipeId);
                    insPs.executeUpdate();
                }
                return true;
            }
        }
    }

    /**
     * Maps a database ResultSet row to an instantiated polymorphic {@link User} subclass.
     */
    private User mapRowToUser(ResultSet rs) throws SQLException {
        Long id = rs.getLong("id");
        String name = rs.getString("name");
        String email = rs.getString("email");
        String password = rs.getString("password");
        String role = rs.getString("role");
        String bio = rs.getString("bio");
        String avatar = rs.getString("avatar");
        Timestamp createdAt = rs.getTimestamp("created_at");
        Timestamp updatedAt = rs.getTimestamp("updated_at");

        return User.create(id, name, email, password, role, bio, avatar, createdAt, updatedAt);
    }
}
