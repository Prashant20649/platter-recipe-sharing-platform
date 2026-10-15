package com.platter.model;

import java.sql.Timestamp;

/**
 * Concrete model representing a Recipe Contributor in the Platter system.
 * Inherits from {@link User} and implements role-specific behavior.
 */
public class ContributorUser extends User {

    public static final String ROLE = "contributor";

    /**
     * Default constructor.
     */
    public ContributorUser() {
        super();
    }

    /**
     * Parameterized constructor.
     */
    public ContributorUser(Long id, String name, String email, String password, String bio, String avatar,
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
        return true;
    }

    @Override
    public boolean canReviewRecipes() {
        return false;
    }
}
