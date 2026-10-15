package com.platter.service;

/**
 * Interface representing a notification dispatch service in Platter.
 * Demonstrates Java contract-driven programming and interface abstractions
 * for delivering alerts, approvals, and message notifications to users.
 */
public interface Notifiable {

    /**
     * Dispatches a notification to a specific recipient.
     *
     * @param recipientEmail the email address of the notification target
     * @param subject        the notification title or summary
     * @param messageContent the notification body
     */
    void sendNotification(String recipientEmail, String subject, String messageContent);
}
