package com.platter.servlet;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.platter.dao.ViewHistoryDAO;
import com.platter.model.Recipe;
import com.platter.model.User;
import com.platter.service.RecipeService;
import com.platter.service.ViewCountService;
import com.platter.util.JsonUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.*;

/**
 * Servlet managing recipe publication, multi-attribute querying, image uploads,
 * asynchronous view count tracking, and administrative review approvals.
 * Supports both JSON and multipart form data submissions.
 */
@WebServlet(name = "RecipeServlet", urlPatterns = "/api/recipes/*")
@MultipartConfig(
        fileSizeThreshold = 1024 * 1024 * 2,  // 2MB
        maxFileSize = 1024 * 1024 * 10,       // 10MB
        maxRequestSize = 1024 * 1024 * 20     // 20MB
)
public class RecipeServlet extends BaseServlet {

    private final RecipeService recipeService = new RecipeService();
    private final ViewHistoryDAO viewHistoryDAO = new ViewHistoryDAO();
    private final ViewCountService viewCountService = ViewCountService.getInstance();

    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if ("PATCH".equalsIgnoreCase(req.getMethod())) {
            doPatch(req, resp);
        } else {
            super.service(req, resp);
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        try {
            if (pathInfo.isEmpty() || "/".equals(pathInfo)) {
                // Public search and browsing: only approved recipes
                String search = req.getParameter("search");
                String cuisine = req.getParameter("cuisine");
                String diet = req.getParameter("diet");
                String sort = req.getParameter("sort");

                List<Recipe> recipes = recipeService.getRecipes(search, cuisine, diet, sort, "approved", null);
                JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                        "recipes", recipes,
                        "total", recipes.size(),
                        "count", recipes.size()
                ));
            } else if ("/my".equals(pathInfo)) {
                // Contributor's own recipes
                User currentUser = requireAuth(req);
                List<Recipe> recipes = recipeService.getRecipes(null, null, null, "newest", null, currentUser.getId());
                JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                        "recipes", recipes,
                        "total", recipes.size()
                ));
            } else if ("/admin/all".equals(pathInfo)) {
                // Admin recipe management: view all statuses
                requireAdmin(req);
                String status = req.getParameter("status");
                List<Recipe> recipes = recipeService.getRecipes(null, null, null, "newest", status, null);
                JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                        "recipes", recipes,
                        "total", recipes.size()
                ));
            } else {
                // Recipe detail by ID: /api/recipes/:id
                Long recipeId = Long.valueOf(pathInfo.substring(1));
                Recipe recipe = recipeService.getRecipeById(recipeId);

                // Asynchronously increment view count in background worker thread
                viewCountService.recordRecipeViewAsync(recipeId);

                // Record browsing history if user is logged in
                User currentUser = getCurrentUser(req);
                if (currentUser != null) {
                    try {
                        viewHistoryDAO.recordView(currentUser.getId(), recipeId);
                    } catch (Exception e) {
                        logger.debug("Could not record view history: {}", e.getMessage());
                    }
                }

                JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                        "recipe", recipe
                ));
            }
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            User currentUser = requireAuth(req);
            Recipe recipe = parseRecipePayload(req);

            Recipe created = recipeService.createRecipe(recipe, currentUser);
            String message = "approved".equalsIgnoreCase(created.getStatus())
                    ? "Recipe published successfully!"
                    : "Recipe submitted! It is currently pending administrator approval.";

            JsonUtil.sendJson(resp, HttpServletResponse.SC_CREATED, Map.of(
                    "message", message,
                    "recipe", created
            ));
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.isEmpty()) {
            JsonUtil.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Missing recipe identifier.");
            return;
        }

        try {
            User currentUser = requireAuth(req);
            Long recipeId = Long.valueOf(pathInfo.substring(1));
            Recipe recipeData = parseRecipePayload(req);

            Recipe updated = recipeService.updateRecipe(recipeId, recipeData, currentUser);
            JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                    "message", "Recipe updated successfully!",
                    "recipe", updated
            ));
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.isEmpty()) {
            JsonUtil.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Missing recipe identifier.");
            return;
        }

        try {
            User currentUser = requireAuth(req);
            Long recipeId = Long.valueOf(pathInfo.substring(1));
            recipeService.deleteRecipe(recipeId, currentUser);

            JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                    "message", "Recipe deleted successfully."
            ));
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    protected void doPatch(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        try {
            if (pathInfo.endsWith("/approval")) {
                // PATCH /api/recipes/:id/approval
                User admin = requireAdmin(req);
                String idStr = pathInfo.substring(1, pathInfo.indexOf("/approval"));
                Long recipeId = Long.valueOf(idStr);

                JsonNode root = parseRequestBody(req, JsonNode.class);
                String status = root != null && root.has("status") ? root.get("status").asText() : "";

                Recipe recipe = recipeService.reviewRecipeSubmission(recipeId, status, admin);
                JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                        "message", "Recipe approval status updated to '" + status + "'.",
                        "recipe", recipe
                ));
            } else {
                JsonUtil.sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found: " + pathInfo);
            }
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    private Recipe parseRecipePayload(HttpServletRequest req) throws IOException, ServletException {
        String contentType = req.getContentType();
        Recipe recipe = new Recipe();

        if (contentType != null && contentType.toLowerCase().contains("multipart/form-data")) {
            recipe.setTitle(getPartValue(req, "title"));
            recipe.setDescription(getPartValue(req, "description"));
            recipe.setCuisine(getPartValue(req, "cuisine"));
            recipe.setDiet(getPartValue(req, "diet"));

            String prep = getPartValue(req, "prepTime");
            if (prep != null && !prep.isEmpty()) recipe.setPrepTime(Integer.parseInt(prep));

            String cook = getPartValue(req, "cookTime");
            if (cook != null && !cook.isEmpty()) recipe.setCookTime(Integer.parseInt(cook));

            String total = getPartValue(req, "totalTime");
            if (total != null && !total.isEmpty()) recipe.setTotalTime(Integer.parseInt(total));

            String serv = getPartValue(req, "servings");
            if (serv != null && !serv.isEmpty()) recipe.setServings(Integer.parseInt(serv));

            // Ingredients (JSON string or array)
            String ingJson = getPartValue(req, "ingredients");
            if (ingJson != null && !ingJson.isEmpty()) {
                try {
                    List<String> ings = mapper.readValue(ingJson, new TypeReference<List<String>>() {});
                    recipe.setIngredients(ings);
                } catch (Exception e) {
                    recipe.setIngredients(Arrays.asList(ingJson.split("\n")));
                }
            }

            // Instructions (JSON string or array)
            String instJson = getPartValue(req, "instructions");
            if (instJson != null && !instJson.isEmpty()) {
                try {
                    List<String> insts = mapper.readValue(instJson, new TypeReference<List<String>>() {});
                    recipe.setInstructions(insts);
                } catch (Exception e) {
                    recipe.setInstructions(Arrays.asList(instJson.split("\n")));
                }
            }

            // Photo upload handling
            Part photoPart = null;
            try {
                photoPart = req.getPart("photo");
            } catch (Exception ignored) {
            }

            if (photoPart != null && photoPart.getSize() > 0) {
                String submittedFileName = photoPart.getSubmittedFileName();
                String ext = "";
                if (submittedFileName != null && submittedFileName.contains(".")) {
                    ext = submittedFileName.substring(submittedFileName.lastIndexOf("."));
                }
                String filename = "recipe-" + UUID.randomUUID() + ext;

                // Save to webapp/uploads directory
                String uploadsDir = req.getServletContext().getRealPath("/uploads");
                if (uploadsDir == null) {
                    uploadsDir = System.getProperty("catalina.base") + File.separator + "webapps" + File.separator + "ROOT" + File.separator + "uploads";
                }
                File uploadDirFile = new File(uploadsDir);
                if (!uploadDirFile.exists()) {
                    uploadDirFile.mkdirs();
                }

                File targetFile = new File(uploadDirFile, filename);
                try (InputStream in = photoPart.getInputStream()) {
                    Files.copy(in, targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
                }
                recipe.setPhotoUrl("/uploads/" + filename);
            } else {
                String photoUrl = getPartValue(req, "photoUrl");
                if (photoUrl != null && !photoUrl.isEmpty()) {
                    recipe.setPhotoUrl(photoUrl);
                }
            }
        } else {
            // JSON body parsing
            JsonNode root = parseRequestBody(req, JsonNode.class);
            if (root != null) {
                if (root.has("title")) recipe.setTitle(root.get("title").asText());
                if (root.has("description")) recipe.setDescription(root.get("description").asText());
                if (root.has("cuisine")) recipe.setCuisine(root.get("cuisine").asText());
                if (root.has("diet")) recipe.setDiet(root.get("diet").asText());
                if (root.has("prepTime")) recipe.setPrepTime(root.get("prepTime").asInt());
                if (root.has("cookTime")) recipe.setCookTime(root.get("cookTime").asInt());
                if (root.has("totalTime")) recipe.setTotalTime(root.get("totalTime").asInt());
                if (root.has("servings")) recipe.setServings(root.get("servings").asInt());
                if (root.has("photoUrl")) recipe.setPhotoUrl(root.get("photoUrl").asText());

                if (root.has("ingredients") && root.get("ingredients").isArray()) {
                    List<String> ings = new ArrayList<>();
                    for (JsonNode n : root.get("ingredients")) {
                        ings.add(n.asText());
                    }
                    recipe.setIngredients(ings);
                }

                if (root.has("instructions") && root.get("instructions").isArray()) {
                    List<String> insts = new ArrayList<>();
                    for (JsonNode n : root.get("instructions")) {
                        insts.add(n.asText());
                    }
                    recipe.setInstructions(insts);
                }
            }
        }

        return recipe;
    }

    private String getPartValue(HttpServletRequest req, String name) {
        try {
            Part p = req.getPart(name);
            if (p != null) {
                try (Scanner scanner = new Scanner(p.getInputStream(), "UTF-8")) {
                    return scanner.useDelimiter("\\A").hasNext() ? scanner.next().trim() : null;
                }
            }
        } catch (Exception ignored) {
        }
        return req.getParameter(name);
    }
}
