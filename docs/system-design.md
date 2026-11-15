# CineCompass: System Design

## 1. What it is
- A movie discovery and recommendation website (TV shows planned later).
- University course project (KAU, CPIT-405 Web Development). Non-commercial, no ads, no payments, built by one student.
- The user gives thumbs up or thumbs down on movies. The site recommends movies with a self-built machine learning model plus simple rules (next film in a series, more films from the same director).

## 2. Constraints
- Course stack: React (Vite), React Router, Context and hooks, fetch, Firebase Authentication, PHP with MySQL as the backend.
- Must use at least one real third-party external API.
- Free hosting only. Frontend on GitHub Pages (static files only), backend on a free PHP and MySQL host (alwaysdata free plan or a university server). Local development uses XAMPP (PHP 8.4, MariaDB 10.11).
- Deliverables: proposal, paper prototype, report, a 5 to 10 minute video, and a live demo. The project will also be shown on GitHub and a CV.

## 3. Architecture

```
 OFFLINE (done once, in Google Colab)
 MovieLens 32M ratings ──► EASE model (top 50 similar movies per movie)
 Wikidata (CC0)        ──► rules: next_in_series, same_director
                            │
                            ▼
              items_seed.csv + item_neighbors.csv
                            │  import_data.php
                            ▼
 ONLINE
 ┌──────────────────────┐   ID token   ┌───────────────────────────────┐
 │ React SPA            │─────────────►│ PHP REST API (PDO)            │
 │ GitHub Pages         │◄─────────────│ free PHP host / XAMPP locally │
 │ Firebase Auth login  │     JSON     │                               │
 └──────────────────────┘              │  ├─ MySQL / MariaDB           │
                                       │  └─ Catalog provider ──► OMDb │
                                       │       (answers cached in      │
                                       │        MySQL, fetched once)   │
                                       └───────────────────────────────┘
```

- The browser never calls the movie data API directly. The PHP backend calls it, so the API key stays secret and every answer is cached in MySQL.
- The model is not run at request time. Its output is a lookup table (`item_neighbors`), and recommendations are one SQL query.

## 4. Data sources
| Source | Used for | Terms |
|---|---|---|
| MovieLens 32M (GroupLens) | Training the model, popularity counts | Research and non-commercial use, with citation |
| Wikidata | Director, film series, sequel order | CC0 (public domain) |
| OMDb API (current choice) | Poster, plot, age rating (PG-13, R), runtime, director, writer, actors, IMDb rating | Free key, 1,000 requests a day |
| IMDb Parents Guide | Link only (no data copied) | Link |
| TVmaze (later) | TV shows | Free, with attribution |

## 5. Machine learning model
- Collaborative filtering on implicit feedback: a rating of 3.5 or more counts as "liked".
- Algorithm: EASE (Embarrassingly Shallow Autoencoder). It learns an item-to-item weight matrix B = −P / diag(P), where P = (XᵀX + λI)⁻¹ and the diagonal of B is set to 0. λ is tuned on a validation set.
- Compared against item-kNN (cosine similarity), a popularity baseline and TruncatedSVD. EASE scored best on the offline test.
- Offline test: users split into train, validation and test groups. Each test user's ratings are split by time: the first 80% are the profile and the last 20% are hidden. Measures are hit rate, precision, recall and NDCG at 10, plus coverage, with bootstrap 95% confidence intervals.
- Output: top 50 neighbours per movie for 4,428 movies (221,400 rows), plus 1,127 series rows and 21,534 director rows.
- At runtime, recent likes count more: the newest like has weight 1, then each older like is multiplied by 0.9 (tuned on validation).

## 6. Recommendation rows on the home page
- "Picked for you": weighted sum of neighbour scores over all liked movies (shown at 5 or more likes).
- "More like X": neighbours of one liked movie (used when the user has 1 to 4 likes).
- "Because you liked X": neighbours of a recent like.
- "Continue the series": next film in a series the user started.
- "More from <director>": other films by the same director.
- "Popular": for new users with no likes.
- Movies already rated (liked or disliked) are never recommended. A "Hide 18+" setting removes R, NC-17 and TV-MA titles using the age rating.

## 7. Database (MySQL, built and loaded)
- `users`: Firebase user id, display name, hide_mature setting.
- `items`: IMDb id, kind (movie or tv), title, year, genres, director, series, popularity, plus cached metadata (age_rating, poster_url, plot, runtime, imdb_rating, actors, full JSON, fetched time).
- `ratings`: user, item, liked (1 or 0), rated_at.
- `watchlist`: user, item, added_at.
- `item_neighbors`: item, neighbour, method (ease, next_in_series, same_director), score.

## 8. REST API (built, PHP 8.4, no framework)
Open to everyone (signed-in users also get their thumbs and watchlist state on each movie):
- `GET /search?q=` searches the local catalog first, then OMDb search.
- `GET /popular?genre=&limit=&offset=` returns the most rated movies (used for "pick movies you like").
- `GET /items/{imdbId}` returns details plus related rows: earlier and next in series, same director, more like this (model).

Sign-in required (Firebase ID token in `Authorization: Bearer`, verified in PHP against Google's public keys):
- `GET /me`, `PATCH /me` (`hideMature`, `displayName`), `DELETE /me`.
- `GET /me/recommendations` returns the home page rows.
- `GET /me/ratings`, `PUT /me/ratings/{id}` with `{"liked": true|false}`, `DELETE /me/ratings/{id}`.
- `GET /me/watchlist`, `PUT /me/watchlist/{id}`, `DELETE /me/watchlist/{id}`.

Movie details are fetched from OMDb in parallel (curl_multi) at most once per movie, then served from MySQL.
A script pre-fills the cache for the most popular movies, within the 1,000 calls a day limit.

## 9. Design patterns (for easy future changes)
- Adapter: one `CatalogProvider` interface with `search()` and `getDetails()`. `OmdbProvider` today. A `TmdbProvider` or `TvmazeProvider` would be one new class with no changes elsewhere.
- Decorator: `CachedProvider` wraps any provider and stores answers in MySQL.
- Strategy: `Recommender` interface (neighbour-based, popularity, mixed).
- One shared item shape in React, so movies and TV shows use the same components.

## 10. Status
- Done: data pipeline and EASE model in Colab, exported CSVs, local XAMPP, database schema and import script, PHP REST API (tested end to end with a test user, including Hide 18+ and fake-token rejection).
- Deployed: the API and database run on alwaysdata (free plan) at https://watchnext.alwaysdata.net. The app is now called WatchNext.
- Done: Firebase project (watchnext-bd939, email and Google sign-in) and the React frontend (Vite, React Router, Context, CSS Modules with design tokens). Services sit behind interfaces (AuthService, MovieApi) and are injected through context from one composition root.
- Next: test sign-in end to end, then put the frontend on GitHub Pages.

## 11. Open decision: which movie metadata API?

**Option A: OMDb**
- Gives poster, plot, age rating, runtime, director, writer, actors (names only), IMDb rating.
- 1,000 requests a day on the free key. Each movie is fetched once and cached, so 4,428 movies need about 5 days in total.
- No terms about AI or machine learning found.

**Option B: TMDB**
- Richer: full cast and crew with photos, high-resolution posters and backdrops, trailers, much higher rate limits. The MovieLens data already includes TMDB ids for each movie.
- Free for non-commercial use, with the TMDB logo and a notice as attribution.
- Concern: the TMDB API Terms of Use (last updated 20 October 2023, https://www.themoviedb.org/api-terms-of-use) say in section 1.C (Restrictions) that the APIs and content may not be used "in connection with, including for training, a machine learning ... based Application". Section 2.A also lists use with AI or machine learning based query systems as commercial use, which needs a written agreement.
- In this project TMDB data would only be displayed (posters, plot, crew). It would never be used to train or run the model, which uses MovieLens only. The question is whether showing TMDB data in an app that also has an ML recommender counts as "in connection with" an ML based application.

**Question for the reviewer:** read sections 1.C and 2.A of the TMDB terms in full at the link above. Is using TMDB for display only, in this non-commercial student app, allowed? Should the project use OMDb, TMDB, or ask TMDB for written permission?
