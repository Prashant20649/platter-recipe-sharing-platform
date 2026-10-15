package com.platter.servlet;

import com.platter.service.ViewCountService;
import com.platter.util.DBConnection;
import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Servlet Context Listener ensuring clean initialization and shutdown
 * of background threads and the HikariCP database connection pool.
 */
@WebListener
public class AppContextListener implements ServletContextListener {

    private static final Logger logger = LoggerFactory.getLogger(AppContextListener.class);

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        logger.info("==================================================");
        logger.info("   Platter Jakarta EE Server Initialized!         ");
        logger.info("==================================================");
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        logger.info("Shutting down Platter Jakarta EE Server resources...");
        ViewCountService.getInstance().shutdown();
        DBConnection.getInstance().close();
        logger.info("Platter shutdown complete.");
    }
}
