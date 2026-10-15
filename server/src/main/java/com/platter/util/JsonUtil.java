package com.platter.util;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Map;

/**
 * Utility class providing Jackson-based JSON serialization, deserialization,
 * and standard HTTP JSON response dispatching.
 */
public final class JsonUtil {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    static {
        MAPPER.registerModule(new JavaTimeModule());
        MAPPER.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        MAPPER.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        MAPPER.setSerializationInclusion(JsonInclude.Include.NON_NULL);
    }

    private JsonUtil() {
        // Prevent instantiation
    }

    /**
     * Retrieves the configured Jackson ObjectMapper.
     *
     * @return the singleton ObjectMapper instance
     */
    public static ObjectMapper getMapper() {
        return MAPPER;
    }

    /**
     * Serializes any Java object to a JSON string.
     *
     * @param obj the object to serialize
     * @return JSON representation
     * @throws RuntimeException if serialization fails
     */
    public static String toJson(Object obj) {
        try {
            return MAPPER.writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException("Error serializing object to JSON", e);
        }
    }

    /**
     * Deserializes a JSON string into an instance of the specified class.
     *
     * @param json  JSON string
     * @param clazz target class
     * @param <T>   type parameter
     * @return the deserialized object
     * @throws RuntimeException if deserialization fails
     */
    public static <T> T fromJson(String json, Class<T> clazz) {
        try {
            return MAPPER.readValue(json, clazz);
        } catch (Exception e) {
            throw new RuntimeException("Error deserializing JSON to " + clazz.getSimpleName(), e);
        }
    }

    /**
     * Reads the entire body from a BufferedReader and deserializes to target class.
     *
     * @param reader HTTP request body reader
     * @param clazz  target class
     * @param <T>    target type
     * @return deserialized instance
     * @throws IOException on reading error
     */
    public static <T> T fromReader(BufferedReader reader, Class<T> clazz) throws IOException {
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        String body = sb.toString();
        if (body.trim().isEmpty()) {
            return null;
        }
        return fromJson(body, clazz);
    }

    /**
     * Sends an HTTP response with JSON payload, status code, and UTF-8 encoding.
     *
     * @param response   HttpServletResponse instance
     * @param statusCode HTTP response status code
     * @param data       payload to serialize and write
     * @throws IOException on write error
     */
    public static void sendJson(HttpServletResponse response, int statusCode, Object data) throws IOException {
        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(statusCode);
        try (PrintWriter writer = response.getWriter()) {
            writer.write(toJson(data));
            writer.flush();
        }
    }

    /**
     * Helper to send a standardized success message response.
     *
     * @param response   HttpServletResponse
     * @param statusCode HTTP status
     * @param message    user feedback message
     * @throws IOException on write error
     */
    public static void sendSuccess(HttpServletResponse response, int statusCode, String message) throws IOException {
        Map<String, Object> map = new HashMap<>();
        map.put("success", true);
        map.put("message", message);
        sendJson(response, statusCode, map);
    }

    /**
     * Helper to send a standardized error response.
     *
     * @param response   HttpServletResponse
     * @param statusCode HTTP error status
     * @param message    error description
     * @throws IOException on write error
     */
    public static void sendError(HttpServletResponse response, int statusCode, String message) throws IOException {
        Map<String, Object> map = new HashMap<>();
        map.put("success", false);
        map.put("message", message);
        sendJson(response, statusCode, map);
    }
}
