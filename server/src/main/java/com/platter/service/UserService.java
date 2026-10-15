package com.platter.service;

import com.platter.dao.UserDAO;
import com.platter.exception.ForbiddenException;
import com.platter.exception.NotFoundException;
import com.platter.exception.UnauthorizedException;
import com.platter.exception.ValidationException;
import com.platter.model.User;
import com.platter.util.PasswordUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

/**
 * Service class orchestrating user authentication, registration,
 * profile management, and administrative user operations.
 */
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    private final UserDAO userDAO;

    /**
     * Default constructor initializing UserDAO instance.
     */
    public UserService() {
        this.userDAO = new UserDAO();
    }

    /**
     * Parameterized constructor for dependency injection and unit testing.
     *
     * @param userDAO the user DAO instance
     */
    public UserService(UserDAO userDAO) {
        this.userDAO = userDAO;
    }

    /**
     * Authenticates a user by email and password.
     *
     * @param email    user email
     * @param password raw candidate password
     * @return authenticated User entity
     */
    public User login(String email, String password) {
        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            throw new ValidationException("Email and password are required.");
        }

        try {
            Optional<User> userOpt = userDAO.findByEmail(email.trim().toLowerCase());
            if (userOpt.isEmpty()) {
                throw new UnauthorizedException("Invalid email or password.");
            }

            User user = userOpt.get();
            if (!PasswordUtil.checkPassword(password, user.getPassword())) {
                throw new UnauthorizedException("Invalid email or password.");
            }

            return user;
        } catch (SQLException e) {
            logger.error("Database error during login: {}", e.getMessage(), e);
            throw new RuntimeException("Database error during authentication", e);
        }
    }

    /**
     * Registers a new user account.
     */
    public User register(String name, String email, String password, String role, String bio) {
        if (name == null || name.trim().isEmpty()) {
            throw new ValidationException("Name is required.");
        }
        if (email == null || email.trim().isEmpty()) {
            throw new ValidationException("Email is required.");
        }
        if (password == null || password.length() < 6) {
            throw new ValidationException("Password must be at least 6 characters.");
        }

        String assignedRole = "explorer";
        if ("contributor".equalsIgnoreCase(role)) {
            assignedRole = "contributor";
        } else if ("admin".equalsIgnoreCase(role)) {
            assignedRole = "admin";
        }

        try {
            Optional<User> existing = userDAO.findByEmail(email.trim().toLowerCase());
            if (existing.isPresent()) {
                throw new ValidationException("An account with this email already exists.");
            }

            String hashedPassword = PasswordUtil.hashPassword(password);
            User newUser = User.create(
                    null,
                    name.trim(),
                    email.trim().toLowerCase(),
                    hashedPassword,
                    assignedRole,
                    bio != null ? bio.trim() : "",
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
                    null,
                    null
            );

            return userDAO.save(newUser);
        } catch (SQLException e) {
            logger.error("Database error during registration: {}", e.getMessage(), e);
            throw new RuntimeException("Database error registering user", e);
        }
    }

    /**
     * Retrieves a user by their unique identifier.
     */
    public User getUserById(Long userId) {
        try {
            return userDAO.findById(userId)
                    .orElseThrow(() -> new NotFoundException("User not found with id: " + userId));
        } catch (SQLException e) {
            logger.error("Error finding user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Database error querying user", e);
        }
    }

    /**
     * Retrieves all registered users (for admin or contributor listing).
     */
    public List<User> getAllUsers() {
        try {
            return userDAO.findAll();
        } catch (SQLException e) {
            logger.error("Error finding all users: {}", e.getMessage(), e);
            throw new RuntimeException("Database error querying all users", e);
        }
    }

    /**
     * Admin creates a new user.
     */
    public User createUserByAdmin(User user, String plainPassword, User adminUser) {
        if (adminUser == null || !adminUser.canApproveRecipes()) {
            throw new ForbiddenException("Only administrators can perform user creation.");
        }
        return register(user.getName(), user.getEmail(), plainPassword, user.getRole(), user.getBio());
    }

    /**
     * Updates user details (Admin or profile owner).
     */
    public User updateUser(Long targetUserId, String name, String email, String role, String bio, String avatar, User currentUser) {
        User existing = getUserById(targetUserId);

        boolean isSelf = existing.getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.canApproveRecipes();

        if (!isSelf && !isAdmin) {
            throw new ForbiddenException("You do not have permission to modify this user.");
        }

        if (name != null && !name.trim().isEmpty()) existing.setName(name.trim());
        if (email != null && !email.trim().isEmpty()) existing.setEmail(email.trim().toLowerCase());
        if (bio != null) existing.setBio(bio.trim());
        if (avatar != null && !avatar.trim().isEmpty()) existing.setAvatar(avatar.trim());

        // Role changes can only be performed by admins
        if (isAdmin && role != null && !role.trim().isEmpty()) {
            if ("admin".equalsIgnoreCase(role) || "contributor".equalsIgnoreCase(role) || "explorer".equalsIgnoreCase(role)) {
                // Return new instance of specific subclass if role changed
                existing = User.create(existing.getId(), existing.getName(), existing.getEmail(),
                        existing.getPassword(), role.toLowerCase(), existing.getBio(),
                        existing.getAvatar(), existing.getCreatedAt(), existing.getUpdatedAt());
            }
        }

        try {
            userDAO.update(existing);
            return existing;
        } catch (SQLException e) {
            logger.error("Error updating user {}: {}", targetUserId, e.getMessage(), e);
            throw new RuntimeException("Database error updating user", e);
        }
    }

    /**
     * Admin deletes a user account.
     */
    public boolean deleteUser(Long targetUserId, User adminUser) {
        if (adminUser == null || !adminUser.canApproveRecipes()) {
            throw new ForbiddenException("Only administrators can delete user accounts.");
        }

        if (adminUser.getId().equals(targetUserId)) {
            throw new ValidationException("Administrators cannot delete their own active account.");
        }

        try {
            return userDAO.deleteById(targetUserId);
        } catch (SQLException e) {
            logger.error("Error deleting user {}: {}", targetUserId, e.getMessage(), e);
            throw new RuntimeException("Database error deleting user", e);
        }
    }

    /**
     * Toggles a recipe favorite state for a user.
     */
    public boolean toggleFavorite(Long userId, Long recipeId) {
        try {
            return userDAO.toggleFavorite(userId, recipeId);
        } catch (SQLException e) {
            logger.error("Error toggling favorite for user {} on recipe {}: {}", userId, recipeId, e.getMessage(), e);
            throw new RuntimeException("Database error updating favorite", e);
        }
    }
}
