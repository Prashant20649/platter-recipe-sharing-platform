package com.platter.model;

import java.sql.Timestamp;

/**
 * Concrete model representing a Recipe Explorer in the Platter system.
 * Inherits from {@link User} and implements role-specific behavior.
 */
public class ExplorerUser extends User {

    public static final String ROLE = "explorer";

    /**
     * Default constructor.
     */
    public ExplorerUser() {
        super();
    }

    /**
     * Parameterized constructor.
     */
    public ExplorerUser(Long id, String name, String email, String password, String bio, String avatar,
                        Timestamp createdAt, Timestamp updatedAt) {
        super(id, name, email, password, bio, avatar, createdAt, updatedAt);
    }

    @Override
    public String getRole() {
        return ROLE;
    }

    @Override
    public boolean canApproveRecipes() {
        return false;
    }

    @Override
    public boolean canCreateRecipes() {
        return false;
    }

    @Override
    public boolean canReviewRecipes() {
        return true;
    }
}
