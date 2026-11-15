-- WatchNext database schema (MySQL 8 / MariaDB 10.4+).
-- Safe to run again: it only creates tables that do not exist yet and never deletes data.
-- Local: the import script runs this file for you. On a host: create the database in the host's panel,
-- then run this file in phpMyAdmin (Import tab) or run the import script there.

-- One row per signed-in person. Firebase handles passwords and sign-in; we only keep the Firebase user id.
CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    firebase_uid  VARCHAR(128) NOT NULL,
    display_name  VARCHAR(100) NULL,
    hide_mature   TINYINT(1)   NOT NULL DEFAULT 0,      -- "Hide 18+" setting (hides R, NC-17, TV-MA)
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_firebase (firebase_uid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Every movie (later also TV show) the app knows about.
-- id is the IMDb id for movies (tt0816692). A TV show without an IMDb id can use 'tvmaze:123'.
-- The first group of columns comes from the model's items_seed.csv.
-- The second group is filled from OMDb the first time someone opens the item, then reused (the cache).
CREATE TABLE IF NOT EXISTS items (
    id                  VARCHAR(32)  NOT NULL,
    kind                ENUM('movie', 'tv') NOT NULL DEFAULT 'movie',
    title               VARCHAR(255) NOT NULL,
    year                SMALLINT UNSIGNED NULL,
    genres              VARCHAR(255) NULL,           -- pipe separated: Action|Crime|Drama
    director            VARCHAR(400) NULL,           -- pipe separated when there are several
    series              VARCHAR(255) NULL,           -- e.g. The Dark Knight Trilogy
    popularity          INT UNSIGNED NOT NULL DEFAULT 0,  -- number of ratings in MovieLens
    in_model            TINYINT(1)   NOT NULL DEFAULT 0,  -- 1 when the recommender has neighbours for it

    age_rating          VARCHAR(20)  NULL,           -- OMDb "Rated": PG-13, R, TV-MA ...
    poster_url          VARCHAR(500) NULL,
    plot                TEXT         NULL,
    runtime             VARCHAR(20)  NULL,
    imdb_rating         DECIMAL(3,1) NULL,
    actors              VARCHAR(500) NULL,
    omdb_json           LONGTEXT     NULL,           -- the full OMDb answer, so new fields need no new API calls
    details_fetched_at  TIMESTAMP    NULL,           -- NULL means "not fetched from OMDb yet"

    PRIMARY KEY (id),
    KEY idx_items_title (title),
    KEY idx_items_popularity (popularity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thumbs up (liked = 1) or thumbs down (liked = 0). One answer per person per item; changing it updates rated_at.
-- rated_at lets the recommender count recent likes more.
CREATE TABLE IF NOT EXISTS ratings (
    user_id   INT UNSIGNED NOT NULL,
    item_id   VARCHAR(32)  NOT NULL,
    liked     TINYINT(1)   NOT NULL,
    rated_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),   -- milliseconds: quick clicks keep their order
    PRIMARY KEY (user_id, item_id),
    KEY idx_ratings_item (item_id),
    CONSTRAINT fk_ratings_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_ratings_item FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- "Watch later" list.
CREATE TABLE IF NOT EXISTS watchlist (
    user_id   INT UNSIGNED NOT NULL,
    item_id   VARCHAR(32)  NOT NULL,
    added_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, item_id),
    KEY idx_watchlist_item (item_id),
    CONSTRAINT fk_watchlist_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_watchlist_item FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The trained model and the rules, from item_neighbors.csv. Read only by the app.
-- method says where a row came from:
--   ease            the machine learning model (EASE), top 50 neighbours per movie
--   next_in_series  rule from Wikidata: the next films in the same series (score 1 = the very next one)
--   same_director   rule from Wikidata: other films by the same director, scored by popularity
-- A new model or rule later is just a new method value; no table change needed.
CREATE TABLE IF NOT EXISTS item_neighbors (
    item_id      VARCHAR(32) NOT NULL,
    neighbor_id  VARCHAR(32) NOT NULL,
    method       VARCHAR(20) NOT NULL,
    score        FLOAT       NOT NULL,
    PRIMARY KEY (item_id, method, neighbor_id),
    KEY idx_neighbors_neighbor (neighbor_id),
    CONSTRAINT fk_neighbors_item FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE,
    CONSTRAINT fk_neighbors_neighbor FOREIGN KEY (neighbor_id) REFERENCES items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
