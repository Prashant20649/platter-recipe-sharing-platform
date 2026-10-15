package com.platter.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.sql.Timestamp;

/**
 * Model class representing a user review and rating for a recipe in Platter.
 * Encapsulates the rating value (1-5), written comment, author summary,
 * and timestamp metadata.
 */
public class Review {

    private Long id;
    private Long userId;
    private Long recipeId;
    private int rating;
    private String comment;
    private UserSummary user;
    private RecipeSummary recipe;
    private Timestamp createdAt;
    private Timestamp updatedAt;

    /**
     * Default constructor.
     */
    public Review() {
    }

    /**
     * Parameterized constructor.
     */
    public Review(Long id, Long userId, Long recipeId, int rating, String comment,
                  Timestamp createdAt, Timestamp updatedAt) {
        this.id = id;
        this.userId = userId;
        this.recipeId = recipeId;
        this.rating = rating;
        this.comment = comment;
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

    public Long getRecipeId() {
        return recipeId;
    }

    public void setRecipeId(Long recipeId) {
        this.recipeId = recipeId;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public UserSummary getUser() {
        return user;
    }

    public void setUser(UserSummary user) {
        this.user = user;
    }

    public RecipeSummary getRecipe() {
        return recipe;
    }

    public void setRecipe(RecipeSummary recipe) {
        this.recipe = recipe;
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
     * Embedded summary representation of a review author.
     */
    public static class UserSummary {
        private Long id;
        private String name;
        private String avatar;
        private String email;

        public UserSummary() {
        }

        public UserSummary(Long id, String name, String avatar, String email) {
            this.id = id;
            this.name = name;
            this.avatar = avatar;
            this.email = email;
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

        public String getAvatar() {
            return avatar;
        }

        public void setAvatar(String avatar) {
            this.avatar = avatar;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }

    /**
     * Embedded summary representation of the reviewed recipe.
     */
    public static class RecipeSummary {
        private Long id;
        private String title;
        private String photoUrl;

        public RecipeSummary() {
        }

        public RecipeSummary(Long id, String title, String photoUrl) {
            this.id = id;
            this.title = title;
            this.photoUrl = photoUrl;
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

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getPhotoUrl() {
            return photoUrl;
        }

        public void setPhotoUrl(String photoUrl) {
            this.photoUrl = photoUrl;
        }
    }
}
