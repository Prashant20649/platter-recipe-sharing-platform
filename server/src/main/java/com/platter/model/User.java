package com.platter.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

/**
 * Abstract base class representing a registered user in the Platter system.
 * Demonstrates Object-Oriented Inheritance and Polymorphism by serving as
 * the parent class for {@link AdminUser}, {@link ContributorUser}, and {@link ExplorerUser}.
 */
public abstract class User {

    private Long id;
    private String name;
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    private String bio;
    private String avatar;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private List<Long> favorites = new ArrayList<>();

    /**
     * Default constructor for serialization and reflection frameworks.
     */
    public User() {
    }

    /**
     * Parameterized constructor for initializing common user attributes.
     *
     * @param id        the unique identifier of the user
     * @param name      the user's full name
     * @param email     the user's email address
     * @param password  the user's hashed password
     * @param bio       the user's biographical description
     * @param avatar    URL to the user's avatar image
     * @param createdAt timestamp of registration
     * @param updatedAt timestamp of latest modification
     */
    public User(Long id, String name, String email, String password, String bio, String avatar,
                Timestamp createdAt, Timestamp updatedAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.bio = bio;
        this.avatar = avatar;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /**
     * Polymorphic method to get the user's role identifier.
     * Each subclass returns its corresponding role name ("admin", "contributor", "explorer").
     *
     * @return the role string
     */
    public abstract String getRole();

    /**
     * Polymorphic capability check: verifies if the user can approve submitted recipes.
     *
     * @return true if permitted, false otherwise
     */
    public abstract boolean canApproveRecipes();

    /**
     * Polymorphic capability check: verifies if the user can create recipes.
     *
     * @return true if permitted, false otherwise
     */
    public abstract boolean canCreateRecipes();

    /**
     * Polymorphic capability check: verifies if the user can post recipe reviews.
     *
     * @return true if permitted, false otherwise
     */
    public abstract boolean canReviewRecipes();

    /**
     * Factory method instantiating the concrete User subclass based on role.
     * Demonstrates polymorphism and factory design pattern.
     *
     * @param id        user ID
     * @param name      user name
     * @param email     user email
     * @param password  user password hash
     * @param role      user role string
     * @param bio       user biography
     * @param avatar    user avatar URL
     * @param createdAt creation timestamp
     * @param updatedAt update timestamp
     * @return an instance of AdminUser, ContributorUser, or ExplorerUser
     */
    public static User create(Long id, String name, String email, String password, String role,
                              String bio, String avatar, Timestamp createdAt, Timestamp updatedAt) {
        if ("admin".equalsIgnoreCase(role)) {
            return new AdminUser(id, name, email, password, bio, avatar, createdAt, updatedAt);
        } else if ("contributor".equalsIgnoreCase(role)) {
            return new ContributorUser(id, name, email, password, bio, avatar, createdAt, updatedAt);
        } else {
            return new ExplorerUser(id, name, email, password, bio, avatar, createdAt, updatedAt);
        }
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    @JsonProperty("_id")
    public Long get_id() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    @JsonIgnore
    public String getPassword() {
        return password;
    }

    @JsonProperty
    public void setPassword(String password) {
        this.password = password;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
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

    public List<Long> getFavorites() {
        return favorites;
    }

    public void setFavorites(List<Long> favorites) {
        this.favorites = favorites != null ? favorites : new ArrayList<>();
    }
}
