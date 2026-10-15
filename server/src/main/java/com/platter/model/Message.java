package com.platter.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.sql.Timestamp;

/**
 * Model class representing a direct interaction message between users in Platter.
 * Encapsulates the message content, sender, recipient, optional recipe reference,
 * read receipt status, and timestamp.
 */
public class Message {

    private Long id;
    private Long senderId;
    private Long recipientId;
    private Long recipeId;
    private String content;
    private boolean read = false;
    private UserSummary sender;
    private UserSummary recipient;
    private RecipeSummary recipe;
    private Timestamp createdAt;

    /**
     * Default constructor.
     */
    public Message() {
    }

    /**
     * Parameterized constructor.
     */
    public Message(Long id, Long senderId, Long recipientId, Long recipeId, String content,
                   boolean read, Timestamp createdAt) {
        this.id = id;
        this.senderId = senderId;
        this.recipientId = recipientId;
        this.recipeId = recipeId;
        this.content = content;
        this.read = read;
        this.createdAt = createdAt;
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

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public Long getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(Long recipientId) {
        this.recipientId = recipientId;
    }

    public Long getRecipeId() {
        return recipeId;
    }

    public void setRecipeId(Long recipeId) {
        this.recipeId = recipeId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    @JsonProperty("read")
    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }

    public UserSummary getSender() {
        return sender;
    }

    public void setSender(UserSummary sender) {
        this.sender = sender;
    }

    public UserSummary getRecipient() {
        return recipient;
    }

    public void setRecipient(UserSummary recipient) {
        this.recipient = recipient;
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

    /**
     * Summary representation of a user participating in messaging.
     */
    public static class UserSummary {
        private Long id;
        private String name;
        private String email;
        private String role;
        private String avatar;

        public UserSummary() {
        }

        public UserSummary(Long id, String name, String email, String role, String avatar) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.role = role;
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

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }

        public String getAvatar() {
            return avatar;
        }

        public void setAvatar(String avatar) {
            this.avatar = avatar;
        }
    }

    /**
     * Summary representation of a referenced recipe in a message.
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
