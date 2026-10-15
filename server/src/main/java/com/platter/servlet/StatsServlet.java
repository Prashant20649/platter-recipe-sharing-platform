package com.platter.servlet;

import com.platter.dao.RecipeDAO;
import com.platter.dao.ReviewDAO;
import com.platter.dao.UserDAO;
import com.platter.model.Recipe;
import com.platter.model.User;
import com.platter.service.RecipeService;
import com.platter.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Servlet generating analytical metrics and graph-ready payloads
 * for Contributor and Administrator dashboards (Recharts integration).
 */
@WebServlet(name = "StatsServlet", urlPatterns = "/api/stats/*")
public class StatsServlet extends BaseServlet {

    private final RecipeService recipeService = new RecipeService();
    private final UserDAO userDAO = new UserDAO();
    private final RecipeDAO recipeDAO = new RecipeDAO();
    private final ReviewDAO reviewDAO = new ReviewDAO();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        try {
            if ("/contributor".equals(pathInfo)) {
                User currentUser = requireAuth(req);
                Map<String, Object> stats = recipeService.getContributorStats(currentUser.getId());
                JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, stats);
            } else if ("/admin".equals(pathInfo)) {
                requireAdmin(req);
                List<User> users = userDAO.findAll();
                List<Recipe> recipes = recipeDAO.searchAndFilter(null, null, null, "newest", null, null);
                long pendingCount = recipes.stream().filter(r -> "pending".equalsIgnoreCase(r.getStatus())).count();
                long approvedCount = recipes.stream().filter(r -> "approved".equalsIgnoreCase(r.getStatus())).count();

                Map<String, Object> stats = new LinkedHashMap<>();
                stats.put("totalUsers", users.size());
                stats.put("totalRecipes", recipes.size());
                stats.put("pendingRecipes", pendingCount);
                stats.put("approvedRecipes", approvedCount);
                stats.put("totalReviews", reviewDAO.findAll().size());

                JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, stats);
            } else {
                JsonUtil.sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found: " + pathInfo);
            }
        } catch (Exception e) {
            handleException(resp, e);
        }
    }
}
