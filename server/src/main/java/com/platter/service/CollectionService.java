package com.platter.service;

import com.platter.dao.CollectionDAO;
import com.platter.dao.RecipeDAO;
import com.platter.exception.ForbiddenException;
import com.platter.exception.NotFoundException;
import com.platter.exception.ValidationException;
import com.platter.model.Collection;
import com.platter.model.Recipe;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.SQLException;
import java.util.List;

/**
 * Service managing user recipe collections and bookmark organization.
 */
public class CollectionService {

    private static final Logger logger = LoggerFactory.getLogger(CollectionService.class);

    private final CollectionDAO collectionDAO;
    private final RecipeDAO recipeDAO;

    /**
     * Default constructor initializing DAOs with standard instances.
     */
    public CollectionService() {
        this.collectionDAO = new CollectionDAO();
        this.recipeDAO = new RecipeDAO();
    }

    /**
     * Parameterized constructor for dependency injection and unit testing.
     *
     * @param collectionDAO the collection DAO instance
     * @param recipeDAO     the recipe DAO instance
     */
    public CollectionService(CollectionDAO collectionDAO, RecipeDAO recipeDAO) {
        this.collectionDAO = collectionDAO;
        this.recipeDAO = recipeDAO;
    }

    /**
     * Retrieves all collections for a user.
     */
    public List<Collection> getUserCollections(Long userId) {
        try {
            return collectionDAO.findByUserId(userId);
        } catch (SQLException e) {
            logger.error("Error fetching collections for user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Database error fetching collections", e);
        }
    }

    /**
     * Creates a new named recipe collection.
     */
    public Collection createCollection(String name, String description, Long userId) {
        if (name == null || name.trim().isEmpty()) {
            throw new ValidationException("Collection name is required.");
        }

        Collection col = new Collection(null, userId, name.trim(), description != null ? description.trim() : "", null, null);
        try {
            return collectionDAO.save(col);
        } catch (SQLException e) {
            logger.error("Error creating collection: {}", e.getMessage(), e);
            throw new RuntimeException("Database error creating collection", e);
        }
    }

    /**
     * Updates collection title and description.
     */
    public Collection updateCollection(Long collectionId, String name, String description, Long userId) {
        if (name == null || name.trim().isEmpty()) {
            throw new ValidationException("Collection name is required.");
        }

        try {
            Collection existing = collectionDAO.findById(collectionId)
                    .orElseThrow(() -> new NotFoundException("Collection not found with id: " + collectionId));

            if (!existing.getUserId().equals(userId)) {
                throw new ForbiddenException("You do not have permission to modify this collection.");
            }

            existing.setName(name.trim());
            if (description != null) {
                existing.setDescription(description.trim());
            }

            collectionDAO.update(existing);
            return existing;
        } catch (SQLException e) {
            logger.error("Error updating collection {}: {}", collectionId, e.getMessage(), e);
            throw new RuntimeException("Database error updating collection", e);
        }
    }

    /**
     * Deletes a collection.
     */
    public boolean deleteCollection(Long collectionId, Long userId) {
        try {
            Collection existing = collectionDAO.findById(collectionId)
                    .orElseThrow(() -> new NotFoundException("Collection not found with id: " + collectionId));

            if (!existing.getUserId().equals(userId)) {
                throw new ForbiddenException("You do not have permission to delete this collection.");
            }

            return collectionDAO.deleteById(collectionId);
        } catch (SQLException e) {
            logger.error("Error deleting collection {}: {}", collectionId, e.getMessage(), e);
            throw new RuntimeException("Database error deleting collection", e);
        }
    }

    /**
     * Adds a recipe to a collection.
     */
    public boolean addRecipeToCollection(Long collectionId, Long recipeId, Long userId) {
        try {
            Collection existing = collectionDAO.findById(collectionId)
                    .orElseThrow(() -> new NotFoundException("Collection not found with id: " + collectionId));

            if (!existing.getUserId().equals(userId)) {
                throw new ForbiddenException("You do not have permission to modify this collection.");
            }

            Recipe recipe = recipeDAO.findById(recipeId)
                    .orElseThrow(() -> new NotFoundException("Recipe not found with id: " + recipeId));

            return collectionDAO.addRecipe(collectionId, recipe.getId());
        } catch (SQLException e) {
            logger.error("Error adding recipe {} to collection {}: {}", recipeId, collectionId, e.getMessage(), e);
            throw new RuntimeException("Database error adding recipe to collection", e);
        }
    }

    /**
     * Removes a recipe from a collection.
     */
    public boolean removeRecipeFromCollection(Long collectionId, Long recipeId, Long userId) {
        try {
            Collection existing = collectionDAO.findById(collectionId)
                    .orElseThrow(() -> new NotFoundException("Collection not found with id: " + collectionId));

            if (!existing.getUserId().equals(userId)) {
                throw new ForbiddenException("You do not have permission to modify this collection.");
            }

            return collectionDAO.removeRecipe(collectionId, recipeId);
        } catch (SQLException e) {
            logger.error("Error removing recipe {} from collection {}: {}", recipeId, collectionId, e.getMessage(), e);
            throw new RuntimeException("Database error removing recipe from collection", e);
        }
    }
}
