package com.platter.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.SecretKey;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Properties;

/**
 * Utility for issuing, signing, parsing, and extracting JSON Web Tokens (JWT).
 * Utilizes the JJWT library with HMAC-SHA signing algorithms.
 */
public final class JwtUtil {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);
    private static final String DEFAULT_SECRET = "platter_super_secret_jwt_key_2026_java_jakarta_ee_secure_token_512";
    private static final long DEFAULT_EXPIRATION_MS = 604800000L; // 7 days

    private static String secret;
    private static long expirationMs;
    private static SecretKey secretKey;

    static {
        loadConfig();
    }

    private JwtUtil() {
    }

    private static void loadConfig() {
        Properties props = new Properties();
        try (InputStream in = JwtUtil.class.getClassLoader().getResourceAsStream("db.properties")) {
            if (in != null) {
                props.load(in);
            }
        } catch (Exception e) {
            logger.warn("Could not load jwt configuration from db.properties, using defaults");
        }

        secret = props.getProperty("jwt.secret", DEFAULT_SECRET);
        // Ensure at least 32 bytes for HMAC-SHA
        if (secret.length() < 32) {
            secret = (secret + DEFAULT_SECRET).substring(0, 40);
        }
        expirationMs = Long.parseLong(props.getProperty("jwt.expirationMs", String.valueOf(DEFAULT_EXPIRATION_MS)));
        secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Generates a signed JWT token containing user identity and role claims.
     *
     * @param userId the user's primary key
     * @param email  the user's email address
     * @param role   the user's role ("admin", "contributor", "explorer")
     * @return the serialized JWT string
     */
    public static String generateToken(Long userId, String email, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }

    /**
     * Parses and verifies a JWT token.
     *
     * @param token the candidate JWT
     * @return the parsed Claims payload
     * @throws JwtException if token is expired, malformed, or signature is invalid
     */
    public static Claims parseToken(String token) throws JwtException {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Extracts token from either the HTTP cookie named "token" or "jwt",
     * or from the "Authorization: Bearer <token>" header.
     *
     * @param request the current HttpServletRequest
     * @return the extracted token string or null if not found
     */
    public static String extractToken(HttpServletRequest request) {
        // 1. Check Cookies
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if ("token".equalsIgnoreCase(c.getName()) || "jwt".equalsIgnoreCase(c.getName())) {
                    if (c.getValue() != null && !c.getValue().trim().isEmpty()) {
                        return c.getValue().trim();
                    }
                }
            }
        }

        // 2. Check Authorization header
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7).trim();
        }

        return null;
    }
}
