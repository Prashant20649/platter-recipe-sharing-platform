package com.platter.servlet;

import com.fasterxml.jackson.databind.JsonNode;
import com.platter.model.Message;
import com.platter.model.User;
import com.platter.service.MessageService;
import com.platter.util.JsonUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Servlet handling direct communication messages between users.
 */
@WebServlet(name = "MessageServlet", urlPatterns = "/api/messages/*")
public class MessageServlet extends BaseServlet {

    private final MessageService messageService = new MessageService();

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
        try {
            User currentUser = requireAuth(req);
            List<Message> messages = messageService.getUserMessages(currentUser.getId());
            JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of("messages", messages));
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            User currentUser = requireAuth(req);
            JsonNode root = parseRequestBody(req, JsonNode.class);

            Long recipientId = null;
            if (root.has("recipientId") && !root.get("recipientId").isNull()) {
                recipientId = root.get("recipientId").asLong();
            } else if (root.has("recipient") && !root.get("recipient").isNull()) {
                recipientId = root.get("recipient").asLong();
            }

            Long recipeId = null;
            if (root.has("recipeId") && !root.get("recipeId").isNull()) {
                recipeId = root.get("recipeId").asLong();
            } else if (root.has("recipe") && !root.get("recipe").isNull()) {
                recipeId = root.get("recipe").asLong();
            }

            String content = root.has("content") ? root.get("content").asText() : "";

            Message sent = messageService.sendMessage(recipientId, recipeId, content, currentUser);
            JsonUtil.sendJson(resp, HttpServletResponse.SC_CREATED, Map.of(
                    "message", "Message delivered successfully!",
                    "data", sent
            ));
        } catch (Exception e) {
            handleException(resp, e);
        }
    }

    protected void doPatch(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        try {
            User currentUser = requireAuth(req);
            if (pathInfo.endsWith("/read")) {
                String idStr = pathInfo.substring(1, pathInfo.indexOf("/read"));
                Long messageId = Long.valueOf(idStr);
                messageService.markMessageAsRead(messageId, currentUser.getId());
                JsonUtil.sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                        "message", "Message marked as read."
                ));
            } else {
                JsonUtil.sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found: " + pathInfo);
            }
        } catch (Exception e) {
            handleException(resp, e);
        }
    }
}
