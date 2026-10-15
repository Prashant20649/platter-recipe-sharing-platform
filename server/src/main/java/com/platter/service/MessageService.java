package com.platter.service;

import com.platter.dao.MessageDAO;
import com.platter.dao.UserDAO;
import com.platter.exception.NotFoundException;
import com.platter.exception.ValidationException;
import com.platter.model.Message;
import com.platter.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

/**
 * Service orchestrating user direct messaging and interaction history.
 * Implements {@link Notifiable} for logging and dispatching message alerts.
 */
public class MessageService implements Notifiable {

    private static final Logger logger = LoggerFactory.getLogger(MessageService.class);

    private final MessageDAO messageDAO;
    private final UserDAO userDAO;

    /**
     * Default constructor initializing DAOs with standard instances.
     */
    public MessageService() {
        this.messageDAO = new MessageDAO();
        this.userDAO = new UserDAO();
    }

    /**
     * Parameterized constructor for dependency injection and unit testing.
     *
     * @param messageDAO the message DAO instance
     * @param userDAO    the user DAO instance
     */
    public MessageService(MessageDAO messageDAO, UserDAO userDAO) {
        this.messageDAO = messageDAO;
        this.userDAO = userDAO;
    }

    /**
     * Sends a direct message from the current user to a recipient.
     */
    public Message sendMessage(Long recipientId, Long recipeId, String content, User sender) {
        if (sender == null) {
            throw new ValidationException("Sender cannot be null.");
        }
        if (recipientId == null) {
            throw new ValidationException("Recipient user must be selected.");
        }
        if (sender.getId().equals(recipientId)) {
            throw new ValidationException("You cannot send a message to yourself.");
        }
        if (content == null || content.trim().isEmpty()) {
            throw new ValidationException("Message content cannot be empty.");
        }

        try {
            Optional<User> recipientOpt = userDAO.findById(recipientId);
            if (recipientOpt.isEmpty()) {
                throw new NotFoundException("Recipient user not found.");
            }

            Message message = new Message(null, sender.getId(), recipientId, recipeId, content.trim(), false, null);
            Message saved = messageDAO.save(message);

            // Notify recipient
            User recipient = recipientOpt.get();
            sendNotification(
                    recipient.getEmail(),
                    "New message from " + sender.getName(),
                    "You received a message on Platter: \"" + content.trim() + "\""
            );

            // Re-fetch with full associations
            return messageDAO.findById(saved.getId()).orElse(saved);
        } catch (SQLException e) {
            logger.error("Error sending message: {}", e.getMessage(), e);
            throw new RuntimeException("Database error sending message", e);
        }
    }

    /**
     * Retrieves all messages sent or received by a user.
     */
    public List<Message> getUserMessages(Long userId) {
        try {
            return messageDAO.findUserMessages(userId);
        } catch (SQLException e) {
            logger.error("Error fetching user messages for {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Database error fetching messages", e);
        }
    }

    /**
     * Marks a message as read.
     */
    public boolean markMessageAsRead(Long messageId, Long recipientId) {
        try {
            return messageDAO.markAsRead(messageId, recipientId);
        } catch (SQLException e) {
            logger.error("Error marking message {} as read: {}", messageId, e.getMessage(), e);
            throw new RuntimeException("Database error marking message read", e);
        }
    }

    @Override
    public void sendNotification(String recipientEmail, String subject, String messageContent) {
        logger.info("[MESSAGE NOTIFICATION] To: {} | Subject: {} | Content: {}", recipientEmail, subject, messageContent);
    }
}
