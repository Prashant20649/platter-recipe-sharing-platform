package com.platter.service;

import com.platter.dao.RecipeDAO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.SQLException;
import java.util.concurrent.*;

/**
 * Multithreaded service managing asynchronous recipe view count increments.
 * Demonstrates Java concurrency using an {@link ExecutorService} thread pool
 * and a {@code synchronized} counter for tracking total real-time view updates.
 */
public class ViewCountService {

    private static final Logger logger = LoggerFactory.getLogger(ViewCountService.class);
    private static volatile ViewCountService instance;

    private final ExecutorService executorService;
    private final RecipeDAO recipeDAO;
    private long synchronizedTotalViewUpdates = 0L;

    /**
     * Private constructor initializing the dedicated background thread pool.
     */
    private ViewCountService() {
        this.recipeDAO = new RecipeDAO();
        this.executorService = Executors.newFixedThreadPool(4, new ThreadFactory() {
            private int threadId = 1;
            @Override
            public Thread newThread(Runnable r) {
                Thread t = new Thread(r, "Platter-ViewWorker-" + (threadId++));
                t.setDaemon(true);
                return t;
            }
        });
        logger.info("ViewCountService initialized with 4 background worker threads.");
    }

    /**
     * Retrieves the singleton instance of ViewCountService.
     *
     * @return the ViewCountService instance
     */
    public static ViewCountService getInstance() {
        if (instance == null) {
            synchronized (ViewCountService.class) {
                if (instance == null) {
                    instance = new ViewCountService();
                }
            }
        }
        return instance;
    }

    /**
     * Asynchronously dispatches a view count increment task to the background thread pool.
     * Non-blocking for the HTTP request cycle.
     *
     * @param recipeId the recipe identifier
     */
    public void recordRecipeViewAsync(Long recipeId) {
        if (recipeId == null) return;

        executorService.submit(() -> {
            try {
                recipeDAO.incrementViewCount(recipeId);
                incrementSynchronizedCounter();
                logger.debug("Asynchronously incremented view count for recipe {}. Total tracked: {}",
                        recipeId, getSynchronizedTotalViewUpdates());
            } catch (SQLException e) {
                logger.error("Failed to increment view count for recipe {}: {}", recipeId, e.getMessage());
            }
        });
    }

    /**
     * Increments the synchronized counter tracking all view count operations.
     * Demonstrates the Java {@code synchronized} keyword for mutual exclusion.
     */
    public synchronized void incrementSynchronizedCounter() {
        this.synchronizedTotalViewUpdates++;
    }

    /**
     * Returns the total number of view updates processed since server startup.
     *
     * @return the synchronized view counter value
     */
    public synchronized long getSynchronizedTotalViewUpdates() {
        return this.synchronizedTotalViewUpdates;
    }

    /**
     * Gracefully shuts down the background executor service.
     */
    public void shutdown() {
        logger.info("Shutting down ViewCountService executor pool...");
        executorService.shutdown();
        try {
            if (!executorService.awaitTermination(3, TimeUnit.SECONDS)) {
                executorService.shutdownNow();
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
