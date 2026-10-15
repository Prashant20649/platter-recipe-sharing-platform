package com.platter.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

/**
 * Model class representing a culinary recipe in the Platter system.
 * Encapsulates recipe details, cooking timing, author association,
 * ingredients, instructions, and review metrics.
 */
public class Recipe {

    private Long id;
    private String title;
    private String description;
    private String cuisine;
    private String diet;
    private int prepTime = 15;
    private int cookTime = 20;
    private int totalTime = 35;
    private int servings = 4;
    private String photoUrl;
    private Long authorId;
    private AuthorSummary author;
    private String status = "pending";
    private double averageRating = 0.0;
    private int reviewCount = 0;
    private int viewCount = 0;
    private List<String> ingredients = new ArrayList<>();
    private List<String> instructions = new ArrayList<>();
    private Timestamp createdAt;
    private Timestamp updatedAt;

    /**
     * Default constructor.
     */
    public Recipe() {
    }

    /**
     * Parameterized constructor.
     */
    public Recipe(Long id, String title, String description, String cuisine, String diet,
                  int prepTime, int cookTime, int totalTime, int servings, String photoUrl,
                  Long authorId, String status, double averageRating, int reviewCount,
                  int viewCount, Timestamp createdAt, Timestamp updatedAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.cuisine = cuisine;
        this.diet = diet;
        this.prepTime = prepTime;
        this.cookTime = cookTime;
        this.totalTime = totalTime > 0 ? totalTime : (prepTime + cookTime);
        this.servings = servings;
        this.photoUrl = photoUrl;
        this.authorId = authorId;
        this.status = status;
        this.averageRating = averageRating;
        this.reviewCount = reviewCount;
        this.viewCount = viewCount;
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCuisine() {
        return cuisine;
    }

    public void setCuisine(String cuisine) {
        this.cuisine = cuisine;
    }

    public String getDiet() {
        return diet;
    }

    public void setDiet(String diet) {
        this.diet = diet;
    }

    public int getPrepTime() {
        return prepTime;
    }

    public void setPrepTime(int prepTime) {
        this.prepTime = prepTime;
    }

    public int getCookTime() {
        return cookTime;
    }

    public void setCookTime(int cookTime) {
        this.cookTime = cookTime;
    }

    public int getTotalTime() {
        return totalTime;
    }

    public void setTotalTime(int totalTime) {
        this.totalTime = totalTime;
    }

    public int getServings() {
        return servings;
    }

    public void setServings(int servings) {
        this.servings = servings;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public Long getAuthorId() {
        return authorId;
    }

    public void setAuthorId(Long authorId) {
        this.authorId = authorId;
    }

    public AuthorSummary getAuthor() {
        return author;
    }

    public void setAuthor(AuthorSummary author) {
        this.author = author;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(double averageRating) {
        this.averageRating = averageRating;
    }

    public int getReviewCount() {
        return reviewCount;
    }

    public void setReviewCount(int reviewCount) {
        this.reviewCount = reviewCount;
    }

    public int getViewCount() {
        return viewCount;
    }

    public void setViewCount(int viewCount) {
        this.viewCount = viewCount;
    }

    public List<String> getIngredients() {
        return ingredients;
    }

    public void setIngredients(List<String> ingredients) {
        this.ingredients = ingredients != null ? ingredients : new ArrayList<>();
    }

    public List<String> getInstructions() {
        return instructions;
    }

    public void setInstructions(List<String> instructions) {
        this.instructions = instructions != null ? instructions : new ArrayList<>();
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

    /**
     * Embedded summary representation of a recipe author.
     */
    public static class AuthorSummary {
        private Long id;
        private String name;
        private String email;
        private String avatar;

        public AuthorSummary() {
        }

        public AuthorSummary(Long id, String name, String email, String avatar) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.avatar = avatar;
        }

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

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getAvatar() {
            return avatar;
        }

        public void setAvatar(String avatar) {
            this.avatar = avatar;
        }
    }
}
