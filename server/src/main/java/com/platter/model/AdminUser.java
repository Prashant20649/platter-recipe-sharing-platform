package com.platter.model;

import java.sql.Timestamp;

/**
 * Concrete model representing an Administrator in the Platter system.
 * Inherits from {@link User} and implements role-specific behavior.
 */
public class AdminUser extends User {

    public static final String ROLE = "admin";

    /**
     * Default constructor.
     */
    public AdminUser() {
        super();
    }

    /**
     * Parameterized constructor.
     */
    public AdminUser(Long id, String name, String email, String password, String bio, String avatar,
                     Timestamp createdAt, Timestamp updatedAt) {
        super(id, name, email, password, bio, avatar, createdAt, updatedAt);
    }

    @Override
    public String getRole() {
        return ROLE;
    }

    @Override
    public boolean canApproveRecipes() {
        return true;
    }

    @Override
    public boolean canCreateRecipes() {
        return true;
    }

    @Override
    public boolean canReviewRecipes() {
        return true;
    }
}
