package com.platter.dao;

import com.platter.model.Recipe;
import com.platter.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Data Access Object for {@link Recipe} entities.
 * Handles recipe persistence, full-text searching, multi-criteria filtering,
 * ingredient and instruction management, and metric aggregations.
 */
public class RecipeDAO implements BaseDAO<Recipe> {

    @Override
    public Optional<Recipe> findById(Long id) throws SQLException {
        String sql = "SELECT r.*, u.name as author_name, u.email as author_email, u.avatar as author_avatar " +
                     "FROM recipes r " +
                     "JOIN users u ON r.author_id = u.id " +
                     "WHERE r.id = ?";

        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Recipe recipe = mapRowToRecipe(rs);
                    loadIngredientsAndInstructions(conn, recipe);
                    return Optional.of(recipe);
                }
            }
        }
        return Optional.empty();
    }

    @Override
    public List<Recipe> findAll() throws SQLException {
        return searchAndFilter(null, null, null, "newest", null, null);
    }

    /**
     * Advanced query method supporting text search, cuisine filter, diet filter,
     * sorting strategies, status restriction, and author scoping.
     *
     * @param search   search text matching title, description, or ingredients
     * @param cuisine  cuisine name or null/"All"
     * @param diet     diet type or null/"All"
     * @param sort     sorting criteria ("rating", "time", "views", "newest")
     * @param status   lifecycle status filter ("approved", "pending", "rejected") or null
     * @param authorId author ID filter or null
     * @return filtered and sorted list of recipes
     * @throws SQLException on database error
     */
    public List<Recipe> searchAndFilter(String search, String cuisine, String diet,
                                        String sort, String status, Long authorId) throws SQLException {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT DISTINCT r.*, u.name as author_name, u.email as author_email, u.avatar as author_avatar ")
           .append("FROM recipes r ")
           .append("JOIN users u ON r.author_id = u.id ");

        if (search != null && !search.trim().isEmpty()) {
            sql.append("LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id ");
        }

        sql.append("WHERE 1=1 ");

        List<Object> params = new ArrayList<>();

        if (status != null && !status.trim().isEmpty() && !"all".equalsIgnoreCase(status)) {
            sql.append("AND r.status = ? ");
            params.add(status.toLowerCase());
        }

        if (authorId != null) {
            sql.append("AND r.author_id = ? ");
            params.add(authorId);
        }

        if (cuisine != null && !cuisine.trim().isEmpty() && !"all".equalsIgnoreCase(cuisine)) {
            sql.append("AND r.cuisine = ? ");
            params.add(cuisine);
        }

        if (diet != null && !diet.trim().isEmpty() && !"all".equalsIgnoreCase(diet)) {
            sql.append("AND r.diet = ? ");
            params.add(diet);
        }

        if (search != null && !search.trim().isEmpty()) {
            String pattern = "%" + search.trim() + "%";
            sql.append("AND (r.title LIKE ? OR r.description LIKE ? OR ri.ingredient LIKE ?) ");
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);
        }

        // Sorting
        if ("rating".equalsIgnoreCase(sort)) {
            sql.append("ORDER BY r.average_rating DESC, r.review_count DESC ");
        } else if ("time".equalsIgnoreCase(sort)) {
            sql.append("ORDER BY r.total_time ASC ");
        } else if ("views".equalsIgnoreCase(sort)) {
            sql.append("ORDER BY r.view_count DESC ");
        } else {
            sql.append("ORDER BY r.created_at DESC ");
        }

        List<Recipe> recipes = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Recipe recipe = mapRowToRecipe(rs);
                    loadIngredientsAndInstructions(conn, recipe);
                    recipes.add(recipe);
                }
            }
        }
        return recipes;
    }

    @Override
    public Recipe save(Recipe recipe) throws SQLException {
        String sql = "INSERT INTO recipes (title, description, cuisine, diet, prep_time, cook_time, " +
                     "total_time, servings, photo_url, author_id, status, average_rating, review_count, view_count) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = DBConnection.getInstance().getConnection()) {
            conn.setAutoCommit(false);
            try (PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                int totalTime = recipe.getTotalTime() > 0 ? recipe.getTotalTime() :
                        (recipe.getPrepTime() + recipe.getCookTime());

                ps.setString(1, recipe.getTitle());
                ps.setString(2, recipe.getDescription());
                ps.setString(3, recipe.getCuisine());
                ps.setString(4, recipe.getDiet());
                ps.setInt(5, recipe.getPrepTime());
                ps.setInt(6, recipe.getCookTime());
                ps.setInt(7, totalTime);
                ps.setInt(8, recipe.getServings());
                ps.setString(9, recipe.getPhotoUrl());
                ps.setLong(10, recipe.getAuthorId());
                ps.setString(11, recipe.getStatus() != null ? recipe.getStatus() : "pending");
                ps.setDouble(12, recipe.getAverageRating());
                ps.setInt(13, recipe.getReviewCount());
                ps.setInt(14, recipe.getViewCount());
                ps.executeUpdate();

                try (ResultSet generatedKeys = ps.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        recipe.setId(generatedKeys.getLong(1));
                    }
                }

                // Insert ingredients and instructions
                insertIngredients(conn, recipe.getId(), recipe.getIngredients());
                insertInstructions(conn, recipe.getId(), recipe.getInstructions());

                conn.commit();
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
        return recipe;
    }

    @Override
    public boolean update(Recipe recipe) throws SQLException {
        String sql = "UPDATE recipes SET title = ?, description = ?, cuisine = ?, diet = ?, " +
                     "prep_time = ?, cook_time = ?, total_time = ?, servings = ?, photo_url = ?, status = ? " +
                     "WHERE id = ?";

        try (Connection conn = DBConnection.getInstance().getConnection()) {
            conn.setAutoCommit(false);
            try {
                int totalTime = recipe.getTotalTime() > 0 ? recipe.getTotalTime() :
                        (recipe.getPrepTime() + recipe.getCookTime());

                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setString(1, recipe.getTitle());
                    ps.setString(2, recipe.getDescription());
                    ps.setString(3, recipe.getCuisine());
                    ps.setString(4, recipe.getDiet());
                    ps.setInt(5, recipe.getPrepTime());
                    ps.setInt(6, recipe.getCookTime());
                    ps.setInt(7, totalTime);
                    ps.setInt(8, recipe.getServings());
                    ps.setString(9, recipe.getPhotoUrl());
                    ps.setString(10, recipe.getStatus());
                    ps.setLong(11, recipe.getId());
                    ps.executeUpdate();
                }

                // Replace ingredients
                try (PreparedStatement delIng = conn.prepareStatement("DELETE FROM recipe_ingredients WHERE recipe_id = ?")) {
                    delIng.setLong(1, recipe.getId());
                    delIng.executeUpdate();
                }
                insertIngredients(conn, recipe.getId(), recipe.getIngredients());

                // Replace instructions
                try (PreparedStatement delInst = conn.prepareStatement("DELETE FROM recipe_instructions WHERE recipe_id = ?")) {
                    delInst.setLong(1, recipe.getId());
                    delInst.executeUpdate();
                }
                insertInstructions(conn, recipe.getId(), recipe.getInstructions());

                conn.commit();
                return true;
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    @Override
    public boolean deleteById(Long id) throws SQLException {
        String sql = "DELETE FROM recipes WHERE id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    /**
     * Updates approval status of a recipe.
     *
     * @param id     recipe ID
     * @param status "approved" or "rejected"
     * @return true if updated
     * @throws SQLException on error
     */
    public boolean updateStatus(Long id, String status) throws SQLException {
        String sql = "UPDATE recipes SET status = ? WHERE id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setLong(2, id);
            return ps.executeUpdate() > 0;
        }
    }

    /**
     * Atomically increments the view count for a recipe in the database.
     *
     * @param id the recipe ID
     * @throws SQLException on database error
     */
    public void incrementViewCount(Long id) throws SQLException {
        String sql = "UPDATE recipes SET view_count = view_count + 1 WHERE id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            ps.executeUpdate();
        }
    }

    /**
     * Synchronizes recalculated rating and count on the recipe record.
     */
    public void updateRatingMetrics(Long recipeId, double avgRating, int reviewCount) throws SQLException {
        String sql = "UPDATE recipes SET average_rating = ?, review_count = ? WHERE id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDouble(1, avgRating);
            ps.setInt(2, reviewCount);
            ps.setLong(3, recipeId);
            ps.executeUpdate();
        }
    }

    private void insertIngredients(Connection conn, Long recipeId, List<String> ingredients) throws SQLException {
        if (ingredients == null || ingredients.isEmpty()) return;
        String sql = "INSERT INTO recipe_ingredients (recipe_id, ingredient, item_order) VALUES (?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < ingredients.size(); i++) {
                ps.setLong(1, recipeId);
                ps.setString(2, ingredients.get(i));
                ps.setInt(3, i + 1);
                ps.addBatch();
            }
            ps.executeBatch();
        }
    }

    private void insertInstructions(Connection conn, Long recipeId, List<String> instructions) throws SQLException {
        if (instructions == null || instructions.isEmpty()) return;
        String sql = "INSERT INTO recipe_instructions (recipe_id, step_instruction, step_number) VALUES (?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < instructions.size(); i++) {
                ps.setLong(1, recipeId);
                ps.setString(2, instructions.get(i));
                ps.setInt(3, i + 1);
                ps.addBatch();
            }
            ps.executeBatch();
        }
    }

    private void loadIngredientsAndInstructions(Connection conn, Recipe recipe) throws SQLException {
        // Load ingredients
        String ingSql = "SELECT ingredient FROM recipe_ingredients WHERE recipe_id = ? ORDER BY item_order ASC";
        List<String> ingredients = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(ingSql)) {
            ps.setLong(1, recipe.getId());
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ingredients.add(rs.getString("ingredient"));
                }
            }
        }
        recipe.setIngredients(ingredients);

        // Load instructions
        String instSql = "SELECT step_instruction FROM recipe_instructions WHERE recipe_id = ? ORDER BY step_number ASC";
        List<String> instructions = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(instSql)) {
            ps.setLong(1, recipe.getId());
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    instructions.add(rs.getString("step_instruction"));
                }
            }
        }
        recipe.setInstructions(instructions);
    }

    private Recipe mapRowToRecipe(ResultSet rs) throws SQLException {
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

        // Author summary
        r.setAuthor(new Recipe.AuthorSummary(
                rs.getLong("author_id"),
                rs.getString("author_name"),
                rs.getString("author_email"),
                rs.getString("author_avatar")
        ));

        return r;
    }
}
