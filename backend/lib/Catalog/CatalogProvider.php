<?php
declare(strict_types=1);

// Adapter interface: any source of movie or TV details (OMDb today; TMDB or TVmaze later) implements this,
// and maps its own answer into our field names. Nothing else in the app knows which API is used.
interface CatalogProvider
{
    /**
     * Details for each id. Every returned item has at least these keys:
     * id, kind ('movie' or 'tv'), title, year, genres (pipe separated), director (pipe separated),
     * age_rating, poster_url, plot, runtime, imdb_rating, actors.
     * An id the source says does not exist maps to null. Ids that failed for another reason are left out.
     *
     * @param list<string> $ids
     * @return array<string, ?array>
     * @throws CatalogUnavailable when nothing could be fetched (daily limit, network down, bad key)
     */
    public function details(array $ids): array;

    /**
     * Search by title. Each result has at least: id, kind, title, year, poster_url.
     *
     * @return list<array>
     * @throws CatalogUnavailable
     */
    public function search(string $query): array;
}
