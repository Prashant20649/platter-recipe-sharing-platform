package com.platter.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.sql.Timestamp;

/**
 * Model class representing an entry in a user's recipe browsing history.
 * Encapsulates the viewing timestamp, user identifier, and recipe summary.
 */
public class ViewHistoryItem {

    private Long id;
    private Long userId;
    private Long recipeId;
    private Recipe recipe;
    private Timestamp viewedAt;

    /**
     * Default constructor.
     */
    public ViewHistoryItem() {
    }

    /**
     * Parameterized constructor.
     */
    public ViewHistoryItem(Long id, Long userId, Long recipeId, Recipe recipe, Timestamp viewedAt) {
        this.id = id;
        this.userId = userId;
        this.recipeId = recipeId;
        this.recipe = recipe;
        this.viewedAt = viewedAt;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @JsonProperty("_id")
    public Long get_id() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getRecipeId() {
        return recipeId;
    }

    public void setRecipeId(Long recipeId) {
        this.recipeId = recipeId;
    }

    public Recipe getRecipe() {
        return recipe;
    }

    public void setRecipe(Recipe recipe) {
        this.recipe = recipe;
    }

    public Timestamp getViewedAt() {
        return viewedAt;
    }

    public void setViewedAt(Timestamp viewedAt) {
        this.viewedAt = viewedAt;
    }
}
