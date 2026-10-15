package com.platter.dao;

import com.platter.model.Message;
import com.platter.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Data Access Object for {@link Message} entities.
 * Handles peer-to-peer user messaging, read receipts, and recipe context linking.
 */
public class MessageDAO implements BaseDAO<Message> {

    @Override
    public Optional<Message> findById(Long id) throws SQLException {
        String sql = "SELECT m.*, " +
                     "s.name as sender_name, s.email as sender_email, s.role as sender_role, s.avatar as sender_avatar, " +
                     "r.name as recipient_name, r.email as recipient_email, r.role as recipient_role, r.avatar as recipient_avatar, " +
                     "rec.title as recipe_title, rec.photo_url as recipe_photo " +
                     "FROM messages m " +
                     "JOIN users s ON m.sender_id = s.id " +
                     "JOIN users r ON m.recipient_id = r.id " +
                     "LEFT JOIN recipes rec ON m.recipe_id = rec.id " +
                     "WHERE m.id = ?";

        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToMessage(rs));
                }
            }
        }
        return Optional.empty();
    }

    @Override
    public List<Message> findAll() throws SQLException {
        String sql = "SELECT m.*, " +
                     "s.name as sender_name, s.email as sender_email, s.role as sender_role, s.avatar as sender_avatar, " +
                     "r.name as recipient_name, r.email as recipient_email, r.role as recipient_role, r.avatar as recipient_avatar, " +
                     "rec.title as recipe_title, rec.photo_url as recipe_photo " +
                     "FROM messages m " +
                     "JOIN users s ON m.sender_id = s.id " +
                     "JOIN users r ON m.recipient_id = r.id " +
                     "LEFT JOIN recipes rec ON m.recipe_id = rec.id " +
                     "ORDER BY m.created_at DESC";

        List<Message> list = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapRowToMessage(rs));
            }
        }
        return list;
    }

    /**
     * Finds all messages sent to or sent by a user.
     *
     * @param userId the user ID
     * @return list of messages
     * @throws SQLException on error
     */
    public List<Message> findUserMessages(Long userId) throws SQLException {
        String sql = "SELECT m.*, " +
                     "s.name as sender_name, s.email as sender_email, s.role as sender_role, s.avatar as sender_avatar, " +
                     "r.name as recipient_name, r.email as recipient_email, r.role as recipient_role, r.avatar as recipient_avatar, " +
                     "rec.title as recipe_title, rec.photo_url as recipe_photo " +
                     "FROM messages m " +
                     "JOIN users s ON m.sender_id = s.id " +
                     "JOIN users r ON m.recipient_id = r.id " +
                     "LEFT JOIN recipes rec ON m.recipe_id = rec.id " +
                     "WHERE m.sender_id = ? OR m.recipient_id = ? " +
                     "ORDER BY m.created_at DESC";

        List<Message> list = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, userId);
            ps.setLong(2, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRowToMessage(rs));
                }
            }
        }
        return list;
    }

    @Override
    public Message save(Message message) throws SQLException {
        String sql = "INSERT INTO messages (sender_id, recipient_id, recipe_id, content, is_read) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, message.getSenderId());
            ps.setLong(2, message.getRecipientId());
            if (message.getRecipeId() != null) {
                ps.setLong(3, message.getRecipeId());
            } else {
                ps.setNull(3, Types.BIGINT);
            }
            ps.setString(4, message.getContent());
            ps.setBoolean(5, message.isRead());
            ps.executeUpdate();

            try (ResultSet generatedKeys = ps.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    message.setId(generatedKeys.getLong(1));
                }
            }
        }
        return message;
    }

    @Override
    public boolean update(Message message) throws SQLException {
        String sql = "UPDATE messages SET content = ?, is_read = ? WHERE id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, message.getContent());
            ps.setBoolean(2, message.isRead());
            ps.setLong(3, message.getId());
            return ps.executeUpdate() > 0;
        }
    }

    /**
     * Marks a specific message as read by its recipient.
     */
    public boolean markAsRead(Long messageId, Long recipientId) throws SQLException {
        String sql = "UPDATE messages SET is_read = TRUE WHERE id = ? AND recipient_id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, messageId);
            ps.setLong(2, recipientId);
            return ps.executeUpdate() > 0;
        }
    }

    @Override
    public boolean deleteById(Long id) throws SQLException {
        String sql = "DELETE FROM messages WHERE id = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    private Message mapRowToMessage(ResultSet rs) throws SQLException {
        Message msg = new Message(
                rs.getLong("id"),
                rs.getLong("sender_id"),
                rs.getLong("recipient_id"),
                rs.getObject("recipe_id") != null ? rs.getLong("recipe_id") : null,
                rs.getString("content"),
                rs.getBoolean("is_read"),
                rs.getTimestamp("created_at")
        );

        msg.setSender(new Message.UserSummary(
                rs.getLong("sender_id"),
                rs.getString("sender_name"),
                rs.getString("sender_email"),
                rs.getString("sender_role"),
                rs.getString("sender_avatar")
        ));

        msg.setRecipient(new Message.UserSummary(
                rs.getLong("recipient_id"),
                rs.getString("recipient_name"),
                rs.getString("recipient_email"),
                rs.getString("recipient_role"),
                rs.getString("recipient_avatar")
        ));

        if (rs.getObject("recipe_id") != null) {
            msg.setRecipe(new Message.RecipeSummary(
                    rs.getLong("recipe_id"),
                    rs.getString("recipe_title"),
                    rs.getString("recipe_photo")
            ));
        }

        return msg;
    }
}
