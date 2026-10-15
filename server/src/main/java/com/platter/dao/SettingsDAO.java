package com.platter.dao;

import com.platter.model.Settings;
import com.platter.util.DBConnection;

import java.sql.*;

/**
 * Data Access Object for {@link Settings} configuration.
 * Manages retrieval and mutation of platform settings.
 */
public class SettingsDAO {

    /**
     * Retrieves current system settings. If no row exists, creates default settings.
     *
     * @return current Settings object
     * @throws SQLException on database error
     */
    public Settings getSettings() throws SQLException {
        String sql = "SELECT * FROM settings WHERE id = 1";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                return mapRowToSettings(rs);
            }
        }

        // Fallback default
        Settings s = new Settings();
        saveDefault(s);
        return s;
    }

    /**
     * Updates platform system settings.
     *
     * @param settings the new settings
     * @return true if updated successfully
     * @throws SQLException on database error
     */
    public boolean updateSettings(Settings settings) throws SQLException {
        String sql = "UPDATE settings SET site_name = ?, require_approval = ?, allow_reviews = ?, " +
                     "max_ingredients = ?, maintenance_mode = ? WHERE id = 1";

        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, settings.getSiteName());
            ps.setBoolean(2, settings.isRequireApproval());
            ps.setBoolean(3, settings.isAllowReviews());
            ps.setInt(4, settings.getMaxIngredients());
            ps.setBoolean(5, settings.isMaintenanceMode());
            return ps.executeUpdate() > 0;
        }
    }

    private void saveDefault(Settings s) throws SQLException {
        String sql = "INSERT INTO settings (id, site_name, require_approval, allow_reviews, max_ingredients, maintenance_mode) " +
                     "VALUES (1, ?, ?, ?, ?, ?) " +
                     "ON DUPLICATE KEY UPDATE site_name = VALUES(site_name)";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, s.getSiteName());
            ps.setBoolean(2, s.isRequireApproval());
            ps.setBoolean(3, s.isAllowReviews());
            ps.setInt(4, s.getMaxIngredients());
            ps.setBoolean(5, s.isMaintenanceMode());
            ps.executeUpdate();
        }
    }

    private Settings mapRowToSettings(ResultSet rs) throws SQLException {
        return new Settings(
                rs.getLong("id"),
                rs.getString("site_name"),
                rs.getBoolean("require_approval"),
                rs.getBoolean("allow_reviews"),
                rs.getInt("max_ingredients"),
                rs.getBoolean("maintenance_mode"),
                rs.getTimestamp("updated_at")
        );
    }
}
