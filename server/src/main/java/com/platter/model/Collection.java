package com.platter.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

/**
 * Model class representing a user's curated recipe collection in Platter.
 * Encapsulates the collection identity, name, description, owning user,
 * member recipes, and timestamps.
 */
public class Collection {

    private Long id;
    private Long userId;
    private String name;
    private String description;
    private List<Recipe> recipes = new ArrayList<>();
    private Timestamp createdAt;
    private Timestamp updatedAt;

    /**
     * Default constructor.
     */
    public Collection() {
    }

    /**
     * Parameterized constructor.
     */
    public Collection(Long id, Long userId, String name, String description,
                      Timestamp createdAt, Timestamp updatedAt) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<Recipe> getRecipes() {
        return recipes;
    }

    public void setRecipes(List<Recipe> recipes) {
        this.recipes = recipes != null ? recipes : new ArrayList<>();
    }

    @JsonProperty("recipeCount")
    public int getRecipeCount() {
        return recipes != null ? recipes.size() : 0;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public Timestamp getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Timestamp updatedAt) {
        this.updatedAt = updatedAt;
    }
}
