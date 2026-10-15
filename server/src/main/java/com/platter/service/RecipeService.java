package com.platter.service;

import com.platter.dao.RecipeDAO;
import com.platter.dao.SettingsDAO;
import com.platter.dao.UserDAO;
import com.platter.exception.ForbiddenException;
import com.platter.exception.NotFoundException;
import com.platter.exception.ValidationException;
import com.platter.model.Recipe;
import com.platter.model.Settings;
import com.platter.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.SQLException;
import java.util.*;

/**
 * Service class orchestrating recipe lifecycle operations, validation,
 * approval workflows, and statistical aggregations.
 * Demonstrates Collections and Generics ({@link List}, {@link Map}, {@link Set}),
 * polymorphism, and interface implementation ({@link Notifiable}).
 */
public class RecipeService implements Notifiable {

    private static final Logger logger = LoggerFactory.getLogger(RecipeService.class);

    private static final Set<String> ALLOWED_CUISINES = Set.of(
            "Italian", "Asian", "Mexican", "French", "Mediterranean", "Bakery", "American", "Indian"
    );

    private static final Set<String> ALLOWED_DIETS = Set.of(
            "Vegetarian", "Vegan", "Gluten-Free", "Omnivore"
    );

    private final RecipeDAO recipeDAO;
    private final SettingsDAO settingsDAO;
    private final UserDAO userDAO;

    /**
     * Default constructor initializing DAOs with standard instances.
     */
    public RecipeService() {
        this.recipeDAO = new RecipeDAO();
        this.settingsDAO = new SettingsDAO();
        this.userDAO = new UserDAO();
    }

    /**
     * Parameterized constructor for dependency injection and unit testing.
     *
     * @param recipeDAO   the recipe DAO instance
     * @param settingsDAO the settings DAO instance
     * @param userDAO     the user DAO instance
     */
    public RecipeService(RecipeDAO recipeDAO, SettingsDAO settingsDAO, UserDAO userDAO) {
        this.recipeDAO = recipeDAO;
        this.settingsDAO = settingsDAO;
        this.userDAO = userDAO;
    }

    /**
     * Searches and filters recipes with validation.
     */
    public List<Recipe> getRecipes(String search, String cuisine, String diet, String sort, String status, Long authorId) {
        try {
            return recipeDAO.searchAndFilter(search, cuisine, diet, sort, status, authorId);
        } catch (SQLException e) {
            logger.error("Error searching recipes: {}", e.getMessage(), e);
            throw new RuntimeException("Database error querying recipes", e);
        }
    }

    /**
     * Retrieves recipe by primary key.
     */
    public Recipe getRecipeById(Long id) {
        try {
            return recipeDAO.findById(id)
                    .orElseThrow(() -> new NotFoundException("Recipe not found with id: " + id));
        } catch (SQLException e) {
            logger.error("Error finding recipe by id {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Database error querying recipe", e);
        }
    }

    /**
     * Submits a new recipe, applying role checks, max ingredient limits, and approval policies.
     */
    public Recipe createRecipe(Recipe recipe, User user) {
        if (user == null || !user.canCreateRecipes()) {
            throw new ForbiddenException("Only Recipe Contributors and Admins can create recipes.");
        }

        validateRecipe(recipe);

        try {
            Settings settings = settingsDAO.getSettings();

            // Enforce max ingredients limit from system settings
            if (recipe.getIngredients().size() > settings.getMaxIngredients()) {
                throw new ValidationException("Maximum allowed ingredients is " + settings.getMaxIngredients() +
                        ", but recipe has " + recipe.getIngredients().size());
            }

            // Determine initial status based on system settings and user role
            if (user.canApproveRecipes()) {
                recipe.setStatus("approved");
            } else if (settings.isRequireApproval()) {
                recipe.setStatus("pending");
            } else {
                recipe.setStatus("approved");
            }

            recipe.setAuthorId(user.getId());
            return recipeDAO.save(recipe);
        } catch (SQLException e) {
            logger.error("Error saving recipe: {}", e.getMessage(), e);
            throw new RuntimeException("Database error saving recipe", e);
        }
    }

    /**
     * Updates an existing recipe with ownership and permission checks.
     */
    public Recipe updateRecipe(Long recipeId, Recipe updatedData, User currentUser) {
        Recipe existing = getRecipeById(recipeId);

        boolean isAuthor = existing.getAuthorId().equals(currentUser.getId());
        boolean isAdmin = currentUser.canApproveRecipes();

        if (!isAuthor && !isAdmin) {
            throw new ForbiddenException("You do not have permission to modify this recipe.");
        }

        validateRecipe(updatedData);

        try {
            Settings settings = settingsDAO.getSettings();
            if (updatedData.getIngredients().size() > settings.getMaxIngredients()) {
                throw new ValidationException("Maximum allowed ingredients is " + settings.getMaxIngredients());
            }

            existing.setTitle(updatedData.getTitle());
            existing.setDescription(updatedData.getDescription());
            existing.setCuisine(updatedData.getCuisine());
            existing.setDiet(updatedData.getDiet());
            existing.setPrepTime(updatedData.getPrepTime());
            existing.setCookTime(updatedData.getCookTime());
            existing.setTotalTime(updatedData.getTotalTime() > 0 ? updatedData.getTotalTime() :
                    (updatedData.getPrepTime() + updatedData.getCookTime()));
            existing.setServings(updatedData.getServings());
            if (updatedData.getPhotoUrl() != null && !updatedData.getPhotoUrl().isEmpty()) {
                existing.setPhotoUrl(updatedData.getPhotoUrl());
            }
            existing.setIngredients(updatedData.getIngredients());
            existing.setInstructions(updatedData.getInstructions());

            // If non-admin edits and approvals are required, re-set to pending
            if (!isAdmin && settings.isRequireApproval()) {
                existing.setStatus("pending");
            }

            recipeDAO.update(existing);
            return existing;
        } catch (SQLException e) {
            logger.error("Error updating recipe {}: {}", recipeId, e.getMessage(), e);
            throw new RuntimeException("Database error updating recipe", e);
        }
    }

    /**
     * Deletes a recipe with ownership check.
     */
    public boolean deleteRecipe(Long recipeId, User currentUser) {
        Recipe existing = getRecipeById(recipeId);

        boolean isAuthor = existing.getAuthorId().equals(currentUser.getId());
        boolean isAdmin = currentUser.canApproveRecipes();

        if (!isAuthor && !isAdmin) {
            throw new ForbiddenException("You do not have permission to delete this recipe.");
        }

        try {
            return recipeDAO.deleteById(recipeId);
        } catch (SQLException e) {
            logger.error("Error deleting recipe {}: {}", recipeId, e.getMessage(), e);
            throw new RuntimeException("Database error deleting recipe", e);
        }
    }

    /**
     * Approves or rejects a submitted recipe (Admin only).
     */
    public Recipe reviewRecipeSubmission(Long recipeId, String status, User adminUser) {
        if (adminUser == null || !adminUser.canApproveRecipes()) {
            throw new ForbiddenException("Only administrators can approve or reject recipes.");
        }

        if (!"approved".equalsIgnoreCase(status) && !"rejected".equalsIgnoreCase(status)) {
            throw new ValidationException("Invalid status: must be 'approved' or 'rejected'.");
        }

        Recipe recipe = getRecipeById(recipeId);
        try {
            recipeDAO.updateStatus(recipeId, status.toLowerCase());
            recipe.setStatus(status.toLowerCase());

            // Notify recipe author
            Optional<User> authorOpt = userDAO.findById(recipe.getAuthorId());
            authorOpt.ifPresent(author -> sendNotification(
                    author.getEmail(),
                    "Recipe Submission " + status.toUpperCase(),
                    "Your recipe '" + recipe.getTitle() + "' has been " + status.toLowerCase() + " by Admin " + adminUser.getName() + "."
            ));

            return recipe;
        } catch (SQLException e) {
            logger.error("Error updating recipe status: {}", e.getMessage(), e);
            throw new RuntimeException("Database error updating recipe status", e);
        }
    }

    /**
     * Generates statistical engagement analytics for a contributor's recipes.
     * Utilizes Java {@link List} and {@link Map} generics for Recharts rendering.
     */
    public Map<String, Object> getContributorStats(Long authorId) {
        try {
            List<Recipe> recipes = recipeDAO.searchAndFilter(null, null, null, "newest", null, authorId);

            int totalViews = 0;
            int totalReviews = 0;
            double sumRatings = 0.0;
            int ratedRecipesCount = 0;

            List<Map<String, Object>> chartData = new ArrayList<>();

            for (Recipe r : recipes) {
                totalViews += r.getViewCount();
                totalReviews += r.getReviewCount();
                if (r.getReviewCount() > 0) {
                    sumRatings += r.getAverageRating();
                    ratedRecipesCount++;
                }

                Map<String, Object> item = new LinkedHashMap<>();
                item.put("name", r.getTitle().length() > 18 ? r.getTitle().substring(0, 18) + "..." : r.getTitle());
                item.put("views", r.getViewCount());
                item.put("rating", r.getAverageRating());
                item.put("reviews", r.getReviewCount());
                chartData.add(item);
            }

            double overallAvgRating = ratedRecipesCount > 0 ? (sumRatings / ratedRecipesCount) : 0.0;
            overallAvgRating = Math.round(overallAvgRating * 10.0) / 10.0;

            Map<String, Object> stats = new LinkedHashMap<>();
            stats.put("totalRecipes", recipes.size());
            stats.put("totalViews", totalViews);
            stats.put("totalReviews", totalReviews);
            stats.put("averageRating", overallAvgRating);
            stats.put("chartData", chartData);

            return stats;
        } catch (SQLException e) {
            logger.error("Error generating contributor stats: {}", e.getMessage(), e);
            throw new RuntimeException("Database error generating stats", e);
        }
    }

    @Override
    public void sendNotification(String recipientEmail, String subject, String messageContent) {
        logger.info("[NOTIFICATION] To: {} | Subject: {} | Message: {}", recipientEmail, subject, messageContent);
    }

    private void validateRecipe(Recipe recipe) {
        if (recipe == null) {
            throw new ValidationException("Recipe payload cannot be null.");
        }
        if (recipe.getTitle() == null || recipe.getTitle().trim().isEmpty()) {
            throw new ValidationException("Recipe title is required.");
        }
        if (recipe.getDescription() == null || recipe.getDescription().trim().isEmpty()) {
            throw new ValidationException("Recipe description is required.");
        }
        if (recipe.getCuisine() == null || recipe.getCuisine().trim().isEmpty()) {
            throw new ValidationException("Cuisine category is required.");
        }
        if (recipe.getDiet() == null || recipe.getDiet().trim().isEmpty()) {
            throw new ValidationException("Dietary category is required.");
        }
        if (recipe.getIngredients() == null || recipe.getIngredients().isEmpty()) {
            throw new ValidationException("At least one ingredient is required.");
        }
        if (recipe.getInstructions() == null || recipe.getInstructions().isEmpty()) {
            throw new ValidationException("At least one cooking instruction step is required.");
        }
    }
}
