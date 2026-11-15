<?php
declare(strict_types=1);

// Calls other websites' APIs (OMDb, Google). getMany() sends the requests in parallel,
// so loading 20 posters takes about as long as loading one.
final class HttpClient
{
    /**
     * @param array<string,string> $urls  key => URL
     * @return array<string,array{status:int, body:string}>  same keys
     */
    public static function getMany(array $urls): array
    {
        $multi = curl_multi_init();
        curl_multi_setopt($multi, CURLMOPT_MAX_HOST_CONNECTIONS, 8);   // at most 8 at a time per website
        $handles = [];
        foreach ($urls as $key => $url) {
            $handle = curl_init($url);
            curl_setopt_array($handle, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CONNECTTIMEOUT => 5,
                CURLOPT_TIMEOUT => 10,
                CURLOPT_ENCODING => '',                                 // accept gzip
                CURLOPT_USERAGENT => 'WatchNext/1.0 (student project)',
            ]);
            curl_multi_add_handle($multi, $handle);
            $handles[$key] = $handle;
        }
        do {
            $status = curl_multi_exec($multi, $running);
            if ($running) {
                curl_multi_select($multi, 1.0);
            }
        } while ($running && $status === CURLM_OK);

        $results = [];
        foreach ($handles as $key => $handle) {
            $results[$key] = [
                'status' => (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE),
                'body' => (string) curl_multi_getcontent($handle),
            ];
            curl_multi_remove_handle($multi, $handle);
        }
        curl_multi_close($multi);
        return $results;
    }

    public static function get(string $url): array
    {
        return self::getMany(['only' => $url])['only'];
    }
}
