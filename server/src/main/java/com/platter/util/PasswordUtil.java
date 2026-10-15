package com.platter.util;

import org.mindrot.jbcrypt.BCrypt;

/**
 * Utility class providing secure password hashing and verification
 * using the industry-standard BCrypt algorithm with salted rounds.
 */
public final class PasswordUtil {

    private static final int BCRYPT_LOG_ROUNDS = 10;

    private PasswordUtil() {
        // Prevent instantiation of utility class
    }

    /**
     * Hashes a plaintext password using BCrypt with a freshly generated salt.
     *
     * @param plainPassword the raw password to hash
     * @return the BCrypt salted hash string
     */
    public static String hashPassword(String plainPassword) {
        if (plainPassword == null || plainPassword.isEmpty()) {
            throw new IllegalArgumentException("Password cannot be null or empty");
        }
        return BCrypt.hashpw(plainPassword, BCrypt.gensalt(BCRYPT_LOG_ROUNDS));
    }

    /**
     * Verifies a candidate plaintext password against an existing BCrypt hash.
     *
     * @param plainPassword  the candidate raw password
     * @param hashedPassword the stored hashed password
     * @return true if the password matches the hash, false otherwise
     */
    public static boolean checkPassword(String plainPassword, String hashedPassword) {
        if (plainPassword == null || hashedPassword == null) {
            return false;
        }
        try {
            return BCrypt.checkpw(plainPassword, hashedPassword);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    public static void main(String[] args) {
        System.out.println("admin123: " + hashPassword("admin123"));
        System.out.println("chef123: " + hashPassword("chef123"));
        System.out.println("explorer123: " + hashPassword("explorer123"));
    }
}
