<?php
declare(strict_types=1);

// The movie data API could not answer (daily limit reached, network down, wrong key).
// The app keeps working with what is already cached.
final class CatalogUnavailable extends RuntimeException
{
}
