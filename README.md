# WatchNext

Movie recommendations that learn from you. Give a thumbs up or down, and WatchNext suggests what to watch next using a model trained on 32 million ratings, plus rules for sequels and favorite directors.

Built for CPIT-405 (Web Development) at King Abdulaziz University.

## Features
- Personal home page: Picked for you, Continue the series, Because you liked X, More from a director, Popular
- Movie pages with plot, cast, ratings and related movies
- Likes, dislikes and a watchlist, synced to your account
- "Hide 18+" family mode
- Email and Google sign-in
- Apple-style design that works on phones and desktops

## How it works
| Part | Technology |
|---|---|
| Website | React (Vite), React Router, Context and hooks, CSS Modules with design tokens. Hosted on GitHub Pages |
| Sign-in | Firebase Authentication. ID tokens are verified by the PHP API |
| API | PHP 8.4 REST API with MySQL (MariaDB). Hosted on alwaysdata |
| Model | EASE (Embarrassingly Shallow Autoencoder), trained in Google Colab on MovieLens 32M. Its output is stored as a lookup table, so a recommendation is one SQL query |
| Movie details | OMDb API, called by the server only and cached in MySQL |

Design patterns: Adapter (movie data providers), Decorator (MySQL cache), Strategy (recommenders), dependency injection through React context, and interfaces for sign-in and data (`AuthService`, `MovieApi`).

More detail: [docs/system-design.md](docs/system-design.md).

## Run the website locally
```bash
cd frontend
npm install
npm run dev
```
Then open http://localhost:5173. It uses the live API by default; see `frontend/.env`.

## Data credits
- [MovieLens 32M](https://grouplens.org/datasets/movielens/) by GroupLens Research, University of Minnesota (used for training only; the data is not included in this repository)
- [Wikidata](https://www.wikidata.org/) (CC0) for film series and directors
- [OMDb API](https://www.omdbapi.com/) for posters, plots and ratings
