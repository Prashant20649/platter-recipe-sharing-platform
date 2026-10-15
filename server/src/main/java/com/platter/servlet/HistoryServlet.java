package com.platter.servlet;

import com.platter.dao.ViewHistoryDAO;
import com.platter.model.User;
import com.platter.model.ViewHistoryItem;
import com.platter.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Servlet managing user recipe viewing history.
 */
@WebServlet(name = "HistoryServlet", urlPatterns = "/api/history/*")
public class HistoryServlet extends BaseServlet {

    private final ViewHistoryDAO viewHistoryDAO = new ViewHistoryDAO();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            User currentUser = requireAuth(req);
            List<ViewHistoryItem> history = viewHistoryDAO.getViewHistory(currentUser.getId());
            JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of("history", history));
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        try {
            User currentUser = requireAuth(req);

            if (pathInfo.isEmpty() || "/".equals(pathInfo)) {
                // Clear all history
                viewHistoryDAO.clearHistory(currentUser.getId());
                JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                        "message", "Browsing history cleared."
                ));
            } else {
                // Remove specific item: DELETE /api/history/:id
                Long historyId = Long.valueOf(pathInfo.substring(1));
                viewHistoryDAO.deleteHistoryItem(historyId, currentUser.getId());
                JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                        "message", "Item removed from history."
                ));
            }
        } catch (Exception e) {
            handleException(resp, e);
        }
    }
}
