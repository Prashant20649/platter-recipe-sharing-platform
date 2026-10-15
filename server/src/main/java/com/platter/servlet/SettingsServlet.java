package com.platter.servlet;

import com.fasterxml.jackson.databind.JsonNode;
import com.platter.dao.SettingsDAO;
import com.platter.model.Settings;
import com.platter.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;

/**
 * Servlet providing access to platform configuration settings and
 * enabling administrator management of global policies.
 */
@WebServlet(name = "SettingsServlet", urlPatterns = "/api/settings/*")
public class SettingsServlet extends BaseServlet {

    private final SettingsDAO settingsDAO = new SettingsDAO();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        try {
            if ("/admin".equals(pathInfo)) {
                requireAdmin(req);
            }
            Settings settings = settingsDAO.getSettings();
            JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of("settings", settings));
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            requireAdmin(req);
            JsonNode root = parseRequestBody(req, JsonNode.class);

            Settings settings = settingsDAO.getSettings();
            if (root.has("siteName")) settings.setSiteName(root.get("siteName").asText());
            if (root.has("requireApproval")) settings.setRequireApproval(root.get("requireApproval").asBoolean());
            if (root.has("allowReviews")) settings.setAllowReviews(root.get("allowReviews").asBoolean());
            if (root.has("maxIngredients")) settings.setMaxIngredients(root.get("maxIngredients").asInt());
            if (root.has("maintenanceMode")) settings.setMaintenanceMode(root.get("maintenanceMode").asBoolean());

            settingsDAO.updateSettings(settings);

            JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                    "message", "Settings updated successfully!",
                    "settings", settings
            ));
        } catch (Exception e) {
            handleException(resp, e);
        }
    }
}
