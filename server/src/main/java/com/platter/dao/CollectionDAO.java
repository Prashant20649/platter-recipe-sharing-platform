package com.platter.dao;

import com.platter.model.Collection;
import com.platter.model.Recipe;
import com.platter.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Data Access Object for {@link Collection} entities.
 * Handles user-curated recipe collections, member items, and recipe associations.
 */
public class CollectionDAO implements BaseDAO<Collection> {

    @Override
    public Optional<Collection> findById(Long id) throws SQLException {
        String sql = "SELECT * FROM collections WHERE id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Collection col = mapRowToCollection(rs);
                    col.setRecipes(loadCollectionRecipes(conn, col.getId()));
                    return Optional.of(col);
                }
            }
        }
        return Optional.empty();
    }

    @Override
    public List<Collection> findAll() throws SQLException {
        String sql = "SELECT * FROM collections ORDER BY created_at DESC";
        List<Collection> list = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Collection col = mapRowToCollection(rs);
                col.setRecipes(loadCollectionRecipes(conn, col.getId()));
                list.add(col);
            }
        }
        return list;
    }

    /**
     * Finds all collections created by a specific user.
     *
     * @param userId the user ID
     * @return list of user collections with loaded recipes
     * @throws SQLException on error
     */
    public List<Collection> findByUserId(Long userId) throws SQLException {
        String sql = "SELECT * FROM collections WHERE user_id = ? ORDER BY created_at DESC";
        List<Collection> list = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Collection col = mapRowToCollection(rs);
                    col.setRecipes(loadCollectionRecipes(conn, col.getId()));
                    list.add(col);
                }
            }
        }
        return list;
    }

    @Override
    public Collection save(Collection collection) throws SQLException {
        String sql = "INSERT INTO collections (user_id, name, description) VALUES (?, ?, ?)";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, collection.getUserId());
            ps.setString(2, collection.getName());
            ps.setString(3, collection.getDescription());
            ps.executeUpdate();

            try (ResultSet generatedKeys = ps.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    collection.setId(generatedKeys.getLong(1));
                }
            }
        }
        return collection;
    }

    @Override
    public boolean update(Collection collection) throws SQLException {
        String sql = "UPDATE collections SET name = ?, description = ? WHERE id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, collection.getName());
            ps.setString(2, collection.getDescription());
            ps.setLong(3, collection.getId());
            return ps.executeUpdate() > 0;
        }
    }

    @Override
    public boolean deleteById(Long id) throws SQLException {
        String sql = "DELETE FROM collections WHERE id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    /**
     * Adds a recipe to a collection.
     */
    public boolean addRecipe(Long collectionId, Long recipeId) throws SQLException {
        String checkSql = "SELECT 1 FROM collection_items WHERE collection_id = ? AND recipe_id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection()) {
            try (PreparedStatement checkPs = conn.prepareStatement(checkSql)) {
                checkPs.setLong(1, collectionId);
                checkPs.setLong(2, recipeId);
                try (ResultSet rs = checkPs.executeQuery()) {
                    if (rs.next()) {
                        return false; // already present
                    }
                }
            }

            String insertSql = "INSERT INTO collection_items (collection_id, recipe_id) VALUES (?, ?)";
            try (PreparedStatement insPs = conn.prepareStatement(insertSql)) {
                insPs.setLong(1, collectionId);
                insPs.setLong(2, recipeId);
                return insPs.executeUpdate() > 0;
            }
        }
    }

    /**
     * Removes a recipe from a collection.
     */
    public boolean removeRecipe(Long collectionId, Long recipeId) throws SQLException {
        String sql = "DELETE FROM collection_items WHERE collection_id = ? AND recipe_id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, collectionId);
            ps.setLong(2, recipeId);
            return ps.executeUpdate() > 0;
        }
    }

    private List<Recipe> loadCollectionRecipes(Connection conn, Long collectionId) throws SQLException {
        String sql = "SELECT r.*, u.name as author_name, u.email as author_email, u.avatar as author_avatar " +
                     "FROM collection_items ci " +
                     "JOIN recipes r ON ci.recipe_id = r.id " +
                     "JOIN users u ON r.author_id = u.id " +
                     "WHERE ci.collection_id = ? " +
                     "ORDER BY ci.added_at DESC";

        List<Recipe> recipes = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, collectionId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Recipe r = new Recipe(
                            rs.getLong("id"),
                            rs.getString("title"),
                            rs.getString("description"),
                            rs.getString("cuisine"),
                            rs.getString("diet"),
                            rs.getInt("prep_time"),
                            rs.getInt("cook_time"),
                            rs.getInt("total_time"),
                            rs.getInt("servings"),
                            rs.getString("photo_url"),
                            rs.getLong("author_id"),
                            rs.getString("status"),
                            rs.getDouble("average_rating"),
                            rs.getInt("review_count"),
                            rs.getInt("view_count"),
                            rs.getTimestamp("created_at"),
                            rs.getTimestamp("updated_at")
                    );
                    r.setAuthor(new Recipe.AuthorSummary(
                            rs.getLong("author_id"),
                            rs.getString("author_name"),
                            rs.getString("author_email"),
                            rs.getString("author_avatar")
                    ));
                    recipes.add(r);
                }
            }
        }
        return recipes;
    }

    private Collection mapRowToCollection(ResultSet rs) throws SQLException {
        return new Collection(
                rs.getLong("id"),
                rs.getLong("user_id"),
                rs.getString("name"),
                rs.getString("description"),
                rs.getTimestamp("created_at"),
                rs.getTimestamp("updated_at")
        );
    }
}
