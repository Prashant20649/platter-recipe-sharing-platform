package com.platter.dao;

import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

/**
 * Generic Data Access Object interface defining standard CRUD operations.
 * Demonstrates Java generic type parameters and contract-driven interface design.
 *
 * @param <T> the model entity type handled by the DAO implementation
 */
public interface BaseDAO<T> {

    /**
     * Retrieves an entity by its unique identifier.
     *
     * @param id the primary key identifier
     * @return an {@link Optional} containing the found entity, or empty if not found
     * @throws SQLException if a database access error occurs
     */
    Optional<T> findById(Long id) throws SQLException;

    /**
     * Retrieves all entities managed by this DAO.
     *
     * @return a list of all entities
     * @throws SQLException if a database access error occurs
     */
    List<T> findAll() throws SQLException;

    /**
     * Persists a new entity into the database.
     *
     * @param entity the entity to create
     * @return the persisted entity with generated primary key
     * @throws SQLException if a database access error occurs
     */
    T save(T entity) throws SQLException;

    /**
     * Updates an existing entity's state in the database.
     *
     * @param entity the entity with updated values
     * @return true if the record was successfully updated, false otherwise
     * @throws SQLException if a database access error occurs
     */
    boolean update(T entity) throws SQLException;

    /**
     * Deletes an entity record by its unique identifier.
     *
     * @param id the primary key of the record to delete
     * @return true if the record was successfully removed, false otherwise
     * @throws SQLException if a database access error occurs
     */
    boolean deleteById(Long id) throws SQLException;
}
