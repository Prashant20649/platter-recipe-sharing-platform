package com.platter.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.sql.Timestamp;

/**
 * Model class representing platform-wide system settings in Platter.
 * Encapsulates global business configuration like mandatory recipe approvals,
 * comment moderation, maximum ingredients limit, and maintenance mode.
 */
public class Settings {

    private Long id = 1L;
    private String siteName = "Platter";
    private boolean requireApproval = true;
    private boolean allowReviews = true;
    private int maxIngredients = 25;
    private boolean maintenanceMode = false;
    private Timestamp updatedAt;

    /**
     * Default constructor.
     */
    public Settings() {
    }

    /**
     * Parameterized constructor.
     */
    public Settings(Long id, String siteName, boolean requireApproval, boolean allowReviews,
                    int maxIngredients, boolean maintenanceMode, Timestamp updatedAt) {
        this.id = id;
        this.siteName = siteName;
        this.requireApproval = requireApproval;
        this.allowReviews = allowReviews;
        this.maxIngredients = maxIngredients;
        this.maintenanceMode = maintenanceMode;
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

    public String getSiteName() {
        return siteName;
    }

    public void setSiteName(String siteName) {
        this.siteName = siteName;
    }

    public boolean isRequireApproval() {
        return requireApproval;
    }

    public void setRequireApproval(boolean requireApproval) {
        this.requireApproval = requireApproval;
    }

    public boolean isAllowReviews() {
        return allowReviews;
    }

    public void setAllowReviews(boolean allowReviews) {
        this.allowReviews = allowReviews;
    }

    public int getMaxIngredients() {
        return maxIngredients;
    }

    public void setMaxIngredients(int maxIngredients) {
        this.maxIngredients = maxIngredients;
    }

    public boolean isMaintenanceMode() {
        return maintenanceMode;
    }

    public void setMaintenanceMode(boolean maintenanceMode) {
        this.maintenanceMode = maintenanceMode;
    }

    public Timestamp getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Timestamp updatedAt) {
        this.updatedAt = updatedAt;
    }
}
