package com.platter.util;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Properties;

/**
 * Thread-safe Singleton managing the HikariCP database connection pool.
 * Loads configuration dynamically from {@code db.properties}.
 */
public final class DBConnection {

    private static final Logger logger = LoggerFactory.getLogger(DBConnection.class);
    private static volatile DBConnection instance;
    private final HikariDataSource dataSource;
    private final Properties properties = new Properties();

    /**
     * Private constructor initializing the HikariCP DataSource.
     */
    private DBConnection() {
        loadProperties();
        HikariConfig config = new HikariConfig();

        config.setJdbcUrl(properties.getProperty("db.url",
                "jdbc:mysql://127.0.0.1:3307/platter?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&createDatabaseIfNotExist=true"));
        config.setUsername(properties.getProperty("db.username", "root"));
        config.setPassword(properties.getProperty("db.password", "root"));
        config.setDriverClassName(properties.getProperty("db.driver", "com.mysql.cj.jdbc.Driver"));

        int maxPoolSize = Integer.parseInt(properties.getProperty("db.pool.maxSize", "15"));
        int minIdle = Integer.parseInt(properties.getProperty("db.pool.minIdle", "3"));
        long idleTimeout = Long.parseLong(properties.getProperty("db.pool.idleTimeout", "300000"));
        long connTimeout = Long.parseLong(properties.getProperty("db.pool.connectionTimeout", "20000"));

        config.setMaximumPoolSize(maxPoolSize);
        config.setMinimumIdle(minIdle);
        config.setIdleTimeout(idleTimeout);
        config.setConnectionTimeout(connTimeout);
        config.setPoolName("Platter-HikariPool");

        // Useful MySQL performance optimisations
        config.addDataSourceProperty("cachePrepStmts", "true");
        config.addDataSourceProperty("prepStmtCacheSize", "250");
        config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");
        config.addDataSourceProperty("useServerPrepStmts", "true");

        this.dataSource = new HikariDataSource(config);
        logger.info("HikariCP connection pool initialized successfully with maximum pool size of {}", maxPoolSize);

        // Register JVM shutdown hook for clean resource disposal
        Runtime.getRuntime().addShutdownHook(new Thread(this::closePool));
    }

    /**
     * Retrieves the Singleton instance of DBConnection.
     *
     * @return the DBConnection singleton instance
     */
    public static DBConnection getInstance() {
        if (instance == null) {
            synchronized (DBConnection.class) {
                if (instance == null) {
                    instance = new DBConnection();
                }
            }
        }
        return instance;
    }

    /**
     * Loads database and application properties from {@code db.properties} on the classpath.
     */
    private void loadProperties() {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream("db.properties")) {
            if (is != null) {
                properties.load(is);
                logger.info("Loaded database properties from classpath: db.properties");
            } else {
                logger.warn("db.properties not found on classpath, relying on fallback defaults");
            }
        } catch (IOException e) {
            logger.error("Failed to read db.properties file", e);
        }
    }

    /**
     * Obtains an active JDBC connection from the connection pool.
     *
     * @return a valid {@link Connection} instance
     * @throws SQLException if a database access error occurs
     */
    public Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }

    /**
     * Returns a property value from configuration.
     *
     * @param key          property key
     * @param defaultValue default if not present
     * @return property value
     */
    public String getProperty(String key, String defaultValue) {
        return properties.getProperty(key, defaultValue);
    }

    /**
     * Gracefully closes the Hikari connection pool.
     */
    public void closePool() {
        if (dataSource != null && !dataSource.isClosed()) {
            logger.info("Closing HikariCP database connection pool...");
            dataSource.close();
        }
    }

    /**
     * Alias for {@link #closePool()} satisfying standard close conventions.
     */
    public void close() {
        closePool();
    }
}
