package com.platter.service;

import com.platter.dao.RecipeDAO;
import com.platter.dao.ReviewDAO;
import com.platter.dao.SettingsDAO;
import com.platter.exception.ForbiddenException;
import com.platter.exception.NotFoundException;
import com.platter.exception.ValidationException;
import com.platter.model.Recipe;
import com.platter.model.Review;
import com.platter.model.Settings;
import com.platter.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

/**
 * Service class orchestrating recipe ratings and user reviews,
 * enforcing business limits and platform review settings.
 */
public class ReviewService {

    private static final Logger logger = LoggerFactory.getLogger(ReviewService.class);

    private final ReviewDAO reviewDAO;
    private final SettingsDAO settingsDAO;
    private final RecipeDAO recipeDAO;

    /**
     * Default constructor initializing DAOs with standard instances.
     */
    public ReviewService() {
        this.reviewDAO = new ReviewDAO();
        this.settingsDAO = new SettingsDAO();
        this.recipeDAO = new RecipeDAO();
    }

    /**
     * Parameterized constructor for dependency injection and unit testing.
     *
     * @param reviewDAO   the review DAO instance
     * @param settingsDAO the settings DAO instance
     * @param recipeDAO   the recipe DAO instance
     */
    public ReviewService(ReviewDAO reviewDAO, SettingsDAO settingsDAO, RecipeDAO recipeDAO) {
        this.reviewDAO = reviewDAO;
        this.settingsDAO = settingsDAO;
        this.recipeDAO = recipeDAO;
    }

    /**
     * Submits a rating and review for a recipe.
     * Enforces the one-review-per-user-per-recipe rule (updates existing if present).
     */
    public Review submitReview(Long recipeId, int rating, String comment, User user) {
        if (user == null || !user.canReviewRecipes()) {
            throw new ForbiddenException("Your current role does not permit posting recipe reviews.");
        }

        if (rating < 1 || rating > 5) {
            throw new ValidationException("Star rating must be an integer between 1 and 5.");
        }

        if (comment == null || comment.trim().isEmpty()) {
            throw new ValidationException("Review comment text cannot be blank.");
        }

        try {
            Settings settings = settingsDAO.getSettings();
            if (!settings.isAllowReviews()) {
                throw new ValidationException("Recipe reviews and ratings are currently disabled in platform settings.");
            }

            // Ensure recipe exists and is approved
            Recipe recipe = recipeDAO.findById(recipeId)
                    .orElseThrow(() -> new NotFoundException("Recipe not found with id: " + recipeId));

            if (!"approved".equalsIgnoreCase(recipe.getStatus()) && !user.canApproveRecipes()) {
                throw new ValidationException("Cannot review a recipe that is not yet approved.");
            }

            // Check for existing review by this user on this recipe
            Optional<Review> existingOpt = reviewDAO.findByUserAndRecipe(user.getId(), recipeId);
            if (existingOpt.isPresent()) {
                Review existing = existingOpt.get();
                existing.setRating(rating);
                existing.setComment(comment.trim());
                reviewDAO.update(existing);
                return existing;
            } else {
                Review newRev = new Review(null, user.getId(), recipeId, rating, comment.trim(), null, null);
                return reviewDAO.save(newRev);
            }
        } catch (SQLException e) {
            logger.error("Error submitting review: {}", e.getMessage(), e);
            throw new RuntimeException("Database error saving review", e);
        }
    }

    /**
     * Updates an existing review.
     */
    public Review updateReview(Long reviewId, int rating, String comment, User currentUser) {
        if (rating < 1 || rating > 5) {
            throw new ValidationException("Star rating must be between 1 and 5.");
        }
        if (comment == null || comment.trim().isEmpty()) {
            throw new ValidationException("Review comment cannot be blank.");
        }

        try {
            Review existing = reviewDAO.findById(reviewId)
                    .orElseThrow(() -> new NotFoundException("Review not found with id: " + reviewId));

            boolean isAuthor = existing.getUserId().equals(currentUser.getId());
            boolean isAdmin = currentUser.canApproveRecipes();

            if (!isAuthor && !isAdmin) {
                throw new ForbiddenException("You do not have permission to modify this review.");
            }

            existing.setRating(rating);
            existing.setComment(comment.trim());
            reviewDAO.update(existing);
            return existing;
        } catch (SQLException e) {
            logger.error("Error updating review {}: {}", reviewId, e.getMessage(), e);
            throw new RuntimeException("Database error updating review", e);
        }
    }

    /**
     * Deletes a review (Review author or Admin).
     */
    public boolean deleteReview(Long reviewId, User currentUser) {
        try {
            Review existing = reviewDAO.findById(reviewId)
                    .orElseThrow(() -> new NotFoundException("Review not found with id: " + reviewId));

            boolean isAuthor = existing.getUserId().equals(currentUser.getId());
            boolean isAdmin = currentUser.canApproveRecipes();

            if (!isAuthor && !isAdmin) {
                throw new ForbiddenException("You do not have permission to delete this review.");
            }

            return reviewDAO.deleteById(reviewId);
        } catch (SQLException e) {
            logger.error("Error deleting review {}: {}", reviewId, e.getMessage(), e);
            throw new RuntimeException("Database error deleting review", e);
        }
    }

    /**
     * Retrieves all reviews for a specific recipe.
     */
    public List<Review> getRecipeReviews(Long recipeId) {
        try {
            return reviewDAO.findByRecipeId(recipeId);
        } catch (SQLException e) {
            logger.error("Error fetching reviews for recipe {}: {}", recipeId, e.getMessage(), e);
            throw new RuntimeException("Database error fetching reviews", e);
        }
    }

    /**
     * Retrieves all reviews authored by a specific user.
     */
    public List<Review> getUserReviews(Long userId) {
        try {
            return reviewDAO.findByUserId(userId);
        } catch (SQLException e) {
            logger.error("Error fetching reviews for user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Database error fetching user reviews", e);
        }
    }

    /**
     * Retrieves all reviews across the platform for Admin moderation.
     */
    public List<Review> getAllReviews() {
        try {
            return reviewDAO.findAll();
        } catch (SQLException e) {
            logger.error("Error fetching all reviews: {}", e.getMessage(), e);
            throw new RuntimeException("Database error fetching all reviews", e);
        }
    }
}
