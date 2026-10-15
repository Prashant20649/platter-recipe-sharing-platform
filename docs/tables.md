# 🗄️ Platter Database Tables & Schema Reference

The **Platter** database schema is implemented in MySQL 8.0 with InnoDB storage engine, UTF-8 unicode encoding (`utf8mb4_unicode_ci`), foreign key constraints, primary keys, and indexes. All database operations are executed via raw JDBC PreparedStatements without any ORM.

---

## 📋 Summary of Tables

| # | Table Name | Purpose | Primary Key | Foreign Keys |
|---|:---|:---|:---|:---|
| 1 | `users` | User accounts, credentials, and polymorphic role assignment | `id` (AUTO_INCREMENT) | None |
| 2 | `settings` | Platform-wide operational rules and configuration singleton | `id` (AUTO_INCREMENT) | None |
| 3 | `recipes` | Core recipe data, timings, author reference, and metrics | `id` (AUTO_INCREMENT) | `author_id` → `users(id)` |
| 4 | `recipe_ingredients` | Ordered ingredient listing per recipe | `id` (AUTO_INCREMENT) | `recipe_id` → `recipes(id)` |
| 5 | `recipe_instructions` | Step-by-step preparation directions per recipe | `id` (AUTO_INCREMENT) | `recipe_id` → `recipes(id)` |
| 6 | `reviews` | User star ratings (1–5) and written recipe reviews | `id` (AUTO_INCREMENT) | `user_id` → `users(id)`, `recipe_id` → `recipes(id)` |
| 7 | `messages` | Direct messages exchanged between users | `id` (AUTO_INCREMENT) | `sender_id` → `users(id)`, `recipient_id` → `users(id)`, `recipe_id` → `recipes(id)` |
| 8 | `collections` | Named custom recipe collections curated by users | `id` (AUTO_INCREMENT) | `user_id` → `users(id)` |
| 9 | `collection_items` | Many-to-many junction table between collections and recipes | `id` (AUTO_INCREMENT) | `collection_id` → `collections(id)`, `recipe_id` → `recipes(id)` |
| 10 | `view_history` | Recipe browsing and visit history for authenticated users | `id` (AUTO_INCREMENT) | `user_id` → `users(id)`, `recipe_id` → `recipes(id)` |
| 11 | `user_favorites` | Saved favorite recipes for quick access | Composite `(user_id, recipe_id)` | `user_id` → `users(id)`, `recipe_id` → `recipes(id)` |

---

## 1. `users` Table

Stores registered user identities, password hashes, biographical profiles, and role classifications.

```sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'contributor', 'explorer') NOT NULL DEFAULT 'explorer',
    bio TEXT,
    avatar VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB;
```

### Columns & Constraints
| Column | Type | Nullable | Default | Key / Index | Description & Constraints |
|:---|:---|:---|:---|:---|:---|
| `id` | `BIGINT` | No | Auto Increment | Primary Key | Unique identifier for each user |
| `name` | `VARCHAR(100)` | No | None | None | User's full name (e.g. "Chef Mario Rossi") |
| `email` | `VARCHAR(150)` | No | None | Unique Key (`idx_user_email`) | Unique email address used for credential login |
| `password` | `VARCHAR(255)` | No | None | None | Salted BCrypt password hash (10 log rounds) |
| `role` | `ENUM('admin', 'contributor', 'explorer')` | No | `'explorer'` | Index (`idx_user_role`) | Role determining polymorphic user behavior |
| `bio` | `TEXT` | Yes | `NULL` | None | User biographical description and culinary background |
| `avatar` | `VARCHAR(500)` | Yes | `NULL` | None | URL to the user's avatar image |
| `created_at` | `TIMESTAMP` | Yes | `CURRENT_TIMESTAMP` | None | Registration timestamp |
| `updated_at` | `TIMESTAMP` | Yes | `CURRENT_TIMESTAMP` | None | Timestamp of last profile modification |

---

## 2. `settings` Table

Stores platform-wide configuration and administrative switches (maintained as a singleton record with `id = 1`).

```sql
CREATE TABLE settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    site_name VARCHAR(100) NOT NULL DEFAULT 'Platter',
    require_approval BOOLEAN NOT NULL DEFAULT TRUE,
    allow_reviews BOOLEAN NOT NULL DEFAULT TRUE,
    max_ingredients INT NOT NULL DEFAULT 25,
    maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

### Columns & Constraints
| Column | Type | Nullable | Default | Key / Index | Description & Constraints |
|:---|:---|:---|:---|:---|:---|
| `id` | `BIGINT` | No | Auto Increment | Primary Key | Singleton identifier (always `1`) |
| `site_name` | `VARCHAR(100)` | No | `'Platter'` | None | Configurable branding site name |
| `require_approval` | `BOOLEAN` | No | `TRUE` | None | When `TRUE`, new recipes start in `pending` status |
| `allow_reviews` | `BOOLEAN` | No | `TRUE` | None | Global switch enabling or disabling user ratings/reviews |
| `max_ingredients` | `INT` | No | `25` | None | Maximum allowed ingredients in a single recipe submission |
| `maintenance_mode`| `BOOLEAN` | No | `FALSE` | None | When `TRUE`, blocks traffic and renders maintenance banner |
| `updated_at` | `TIMESTAMP` | Yes | `CURRENT_TIMESTAMP` | None | Timestamp of last settings update by administrator |

---

## 3. `recipes` Table

Stores culinary recipes published by contributors, including timing, dietary classifications, approval state, and cached review metrics.

```sql
CREATE TABLE recipes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    cuisine VARCHAR(50) NOT NULL,
    diet VARCHAR(50) NOT NULL,
    prep_time INT NOT NULL DEFAULT 15,
    cook_time INT NOT NULL DEFAULT 20,
    total_time INT NOT NULL DEFAULT 35,
    servings INT NOT NULL DEFAULT 4,
    photo_url VARCHAR(500),
    author_id BIGINT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    average_rating DECIMAL(3, 1) NOT NULL DEFAULT 0.0,
    review_count INT NOT NULL DEFAULT 0,
    view_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_recipe_status (status),
    INDEX idx_recipe_cuisine (cuisine),
    INDEX idx_recipe_diet (diet),
    INDEX idx_recipe_rating (average_rating),
    INDEX idx_recipe_views (view_count),
    INDEX idx_recipe_author (author_id)
) ENGINE=InnoDB;
```

### Columns & Constraints
| Column | Type | Nullable | Default | Key / Index | Description & Constraints |
|:---|:---|:---|:---|:---|:---|
| `id` | `BIGINT` | No | Auto Increment | Primary Key | Unique recipe identifier |
| `title` | `VARCHAR(200)` | No | None | None | Recipe title (e.g. "Authentic Margherita Pizza") |
| `description` | `TEXT` | No | None | None | Summary and flavor profile description |
| `cuisine` | `VARCHAR(50)` | No | None | Index (`idx_recipe_cuisine`) | Cuisine type (Italian, Asian, Mexican, French, etc.) |
| `diet` | `VARCHAR(50)` | No | None | Index (`idx_recipe_diet`) | Dietary tag (Vegetarian, Vegan, Gluten-Free, Omnivore) |
| `prep_time` | `INT` | No | `15` | None | Preparation time in minutes |
| `cook_time` | `INT` | No | `20` | None | Cooking time in minutes |
| `total_time` | `INT` | No | `35` | None | Total time required in minutes |
| `servings` | `INT` | No | `4` | None | Number of portions/servings |
| `photo_url` | `VARCHAR(500)` | Yes | `NULL` | None | URL or `/uploads/...` path to recipe photo |
| `author_id` | `BIGINT` | No | None | Foreign Key (`idx_recipe_author`) | References `users(id)` with `ON DELETE CASCADE` |
| `status` | `ENUM('pending', 'approved', 'rejected')` | No | `'pending'` | Index (`idx_recipe_status`) | Approval state for discovery visibility |
| `average_rating` | `DECIMAL(3, 1)` | No | `0.0` | Index (`idx_recipe_rating`) | Computed average star score (1.0 to 5.0) |
| `review_count` | `INT` | No | `0` | None | Total submitted reviews count |
| `view_count` | `INT` | No | `0` | Index (`idx_recipe_views`) | Recipe page visits incremented asynchronously |
| `created_at` | `TIMESTAMP` | Yes | `CURRENT_TIMESTAMP` | None | Publication timestamp |
| `updated_at` | `TIMESTAMP` | Yes | `CURRENT_TIMESTAMP` | None | Last modification timestamp |

---

## 4. `recipe_ingredients` Table

Stores the normalized, ordered ingredients for each recipe.

```sql
CREATE TABLE recipe_ingredients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipe_id BIGINT NOT NULL,
    ingredient VARCHAR(255) NOT NULL,
    item_order INT NOT NULL DEFAULT 0,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    INDEX idx_recipe_ing (recipe_id)
) ENGINE=InnoDB;
```

### Columns & Constraints
| Column | Type | Nullable | Default | Key / Index | Description & Constraints |
|:---|:---|:---|:---|:---|:---|
| `id` | `BIGINT` | No | Auto Increment | Primary Key | Unique ingredient item identifier |
| `recipe_id` | `BIGINT` | No | None | Foreign Key (`idx_recipe_ing`) | References `recipes(id)` with `ON DELETE CASCADE` |
| `ingredient` | `VARCHAR(255)` | No | None | None | Quantity and ingredient description |
| `item_order` | `INT` | No | `0` | None | Numerical display sequence (1, 2, 3...) |

---

## 5. `recipe_instructions` Table

Stores the step-by-step procedural directions for each recipe.

```sql
CREATE TABLE recipe_instructions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipe_id BIGINT NOT NULL,
    step_instruction TEXT NOT NULL,
    step_number INT NOT NULL DEFAULT 1,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    INDEX idx_recipe_inst (recipe_id)
) ENGINE=InnoDB;
```

### Columns & Constraints
| Column | Type | Nullable | Default | Key / Index | Description & Constraints |
|:---|:---|:---|:---|:---|:---|
| `id` | `BIGINT` | No | Auto Increment | Primary Key | Unique instruction step identifier |
| `recipe_id` | `BIGINT` | No | None | Foreign Key (`idx_recipe_inst`) | References `recipes(id)` with `ON DELETE CASCADE` |
| `step_instruction`| `TEXT` | No | None | None | Detailed cooking instruction for the step |
| `step_number` | `INT` | No | `1` | None | Sequential step number (1, 2, 3...) |

---

## 6. `reviews` Table

Stores ratings (1 to 5 stars) and user feedback on recipes, enforcing a single review per user per recipe constraint.

```sql
CREATE TABLE reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    recipe_id BIGINT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_recipe_review (user_id, recipe_id),
    INDEX idx_review_recipe (recipe_id),
    INDEX idx_review_user (user_id)
) ENGINE=InnoDB;
```

### Columns & Constraints
| Column | Type | Nullable | Default | Key / Index | Description & Constraints |
|:---|:---|:---|:---|:---|:---|
| `id` | `BIGINT` | No | Auto Increment | Primary Key | Unique review identifier |
| `user_id` | `BIGINT` | No | None | Foreign Key (`idx_review_user`) | References `users(id)` with `ON DELETE CASCADE` |
| `recipe_id` | `BIGINT` | No | None | Foreign Key (`idx_review_recipe`) | References `recipes(id)` with `ON DELETE CASCADE` |
| `rating` | `INT` | No | None | Check Constraint | Rating integer between 1 and 5 stars (`CHECK (rating >= 1 AND rating <= 5)`) |
| `comment` | `TEXT` | No | None | None | Written review text and user feedback |
| `created_at` | `TIMESTAMP` | Yes | `CURRENT_TIMESTAMP` | None | Review submission timestamp |
| `updated_at` | `TIMESTAMP` | Yes | `CURRENT_TIMESTAMP` | None | Timestamp of last review edit |
| `uk_user_recipe_review` | `UNIQUE` | — | — | Unique Index | Enforces one review per user per recipe |

---

## 7. `messages` Table

Stores direct communication messages exchanged between community members and chefs.

```sql
CREATE TABLE messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    recipient_id BIGINT NOT NULL,
    recipe_id BIGINT,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE SET NULL,
    INDEX idx_msg_sender (sender_id),
    INDEX idx_msg_recipient (recipient_id)
) ENGINE=InnoDB;
```

### Columns & Constraints
| Column | Type | Nullable | Default | Key / Index | Description & Constraints |
|:---|:---|:---|:---|:---|:---|
| `id` | `BIGINT` | No | Auto Increment | Primary Key | Unique message identifier |
| `sender_id` | `BIGINT` | No | None | Foreign Key (`idx_msg_sender`) | References sending `users(id)` with `ON DELETE CASCADE` |
| `recipient_id` | `BIGINT` | No | None | Foreign Key (`idx_msg_recipient`)| References receiving `users(id)` with `ON DELETE CASCADE` |
| `recipe_id` | `BIGINT` | Yes | `NULL` | Foreign Key | Optional recipe reference (`ON DELETE SET NULL`) |
| `content` | `TEXT` | No | None | None | Message body text |
| `is_read` | `BOOLEAN` | No | `FALSE` | None | Read receipt indicator |
| `created_at` | `TIMESTAMP` | Yes | `CURRENT_TIMESTAMP` | None | Message dispatch timestamp |

---

## 8. `collections` Table

Stores custom named collections created by users to curate and organize recipes.

```sql
CREATE TABLE collections (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_col_user (user_id)
) ENGINE=InnoDB;
```

### Columns & Constraints
| Column | Type | Nullable | Default | Key / Index | Description & Constraints |
|:---|:---|:---|:---|:---|:---|
| `id` | `BIGINT` | No | Auto Increment | Primary Key | Unique collection identifier |
| `user_id` | `BIGINT` | No | None | Foreign Key (`idx_col_user`) | References owning `users(id)` with `ON DELETE CASCADE` |
| `name` | `VARCHAR(100)` | No | None | None | Collection name (e.g., "Weekend Feast", "Quick Dinners") |
| `description` | `TEXT` | Yes | `NULL` | None | Optional description of the collection's theme |
| `created_at` | `TIMESTAMP` | Yes | `CURRENT_TIMESTAMP` | None | Creation timestamp |
| `updated_at` | `TIMESTAMP` | Yes | `CURRENT_TIMESTAMP` | None | Last update timestamp |

---

## 9. `collection_items` Table

Many-to-many junction table mapping recipes into collections.

```sql
CREATE TABLE collection_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    collection_id BIGINT NOT NULL,
    recipe_id BIGINT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    UNIQUE KEY uk_collection_recipe (collection_id, recipe_id),
    INDEX idx_col_item (collection_id)
) ENGINE=InnoDB;
```

### Columns & Constraints
| Column | Type | Nullable | Default | Key / Index | Description & Constraints |
|:---|:---|:---|:---|:---|:---|
| `id` | `BIGINT` | No | Auto Increment | Primary Key | Unique junction identifier |
| `collection_id`| `BIGINT` | No | None | Foreign Key (`idx_col_item`) | References `collections(id)` with `ON DELETE CASCADE` |
| `recipe_id` | `BIGINT` | No | None | Foreign Key | References `recipes(id)` with `ON DELETE CASCADE` |
| `added_at` | `TIMESTAMP` | Yes | `CURRENT_TIMESTAMP` | None | Timestamp recipe was added to collection |
| `uk_collection_recipe` | `UNIQUE` | — | — | Unique Key | Prevents duplicate recipe entries within the same collection |

---

## 10. `view_history` Table

Tracks recipes browsed by authenticated users with automatic timestamp updating.

```sql
CREATE TABLE view_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    recipe_id BIGINT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_recipe_view (user_id, recipe_id),
    INDEX idx_history_user (user_id, viewed_at)
) ENGINE=InnoDB;
```

### Columns & Constraints
| Column | Type | Nullable | Default | Key / Index | Description & Constraints |
|:---|:---|:---|:---|:---|:---|
| `id` | `BIGINT` | No | Auto Increment | Primary Key | Unique history entry identifier |
| `user_id` | `BIGINT` | No | None | Foreign Key | References `users(id)` with `ON DELETE CASCADE` |
| `recipe_id` | `BIGINT` | No | None | Foreign Key | References `recipes(id)` with `ON DELETE CASCADE` |
| `viewed_at` | `TIMESTAMP` | Yes | `CURRENT_TIMESTAMP ON UPDATE` | Index (`idx_history_user`) | Timestamp of latest recipe view |
| `uk_user_recipe_view` | `UNIQUE` | — | — | Unique Key | Ensures one history record per user-recipe pair |

---

## 11. `user_favorites` Table

Stores bookmark favorites linking users to their saved recipes.

```sql
CREATE TABLE user_favorites (
    user_id BIGINT NOT NULL,
    recipe_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, recipe_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

### Columns & Constraints
| Column | Type | Nullable | Default | Key / Index | Description & Constraints |
|:---|:---|:---|:---|:---|:---|
| `user_id` | `BIGINT` | No | None | Composite Primary Key / FK | References `users(id)` with `ON DELETE CASCADE` |
| `recipe_id` | `BIGINT` | No | None | Composite Primary Key / FK | References `recipes(id)` with `ON DELETE CASCADE` |
| `created_at` | `TIMESTAMP` | Yes | `CURRENT_TIMESTAMP` | None | Timestamp recipe was marked as favorite |
