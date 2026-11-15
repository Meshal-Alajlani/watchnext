<?php
declare(strict_types=1);

// Checks a Firebase ID token (a signed JWT) sent by the React app, following Firebase's documented rules:
// https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
// If the signature and claims are valid, the token really came from Firebase for our project,
// and its "sub" claim is the user's Firebase id.
final class FirebaseAuth
{
    private const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
    private const LEEWAY = 60;          // seconds of clock difference allowed between this server and Google

    public function __construct(private string $projectId)
    {
    }

    /** @return array the token's claims (sub = user id, name, email ...) */
    public function verify(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new ApiError(401, 'Invalid sign-in token');
        }
        [$headerPart, $claimsPart, $signaturePart] = $parts;
        $header = json_decode(self::base64UrlDecode($headerPart), true);
        $claims = json_decode(self::base64UrlDecode($claimsPart), true);
        $signature = self::base64UrlDecode($signaturePart);
        if (!is_array($header) || !is_array($claims) || $signature === ''
            || ($header['alg'] ?? '') !== 'RS256' || !is_string($header['kid'] ?? null)) {
            throw new ApiError(401, 'Invalid sign-in token');
        }

        $now = time();
        $valid = is_int($claims['exp'] ?? null) && $claims['exp'] > $now - self::LEEWAY
            && is_int($claims['iat'] ?? null) && $claims['iat'] <= $now + self::LEEWAY
            && is_int($claims['auth_time'] ?? null) && $claims['auth_time'] <= $now + self::LEEWAY
            && ($claims['aud'] ?? null) === $this->projectId
            && ($claims['iss'] ?? null) === 'https://securetoken.google.com/' . $this->projectId
            && is_string($claims['sub'] ?? null) && $claims['sub'] !== '' && strlen($claims['sub']) <= 128;
        if (!$valid) {
            throw new ApiError(401, 'Sign-in token expired or made for another app. Sign in again.');
        }

        $certificate = $this->certificate($header['kid']);
        if ($certificate === null || openssl_verify("$headerPart.$claimsPart", $signature, $certificate, OPENSSL_ALGO_SHA256) !== 1) {
            throw new ApiError(401, 'Invalid sign-in token');
        }
        return $claims;
    }

    // Google's public certificates, kept in a temporary file for an hour (Google changes them about daily).
    private function certificate(string $keyId): ?string
    {
        $file = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'cinecompass_firebase_certs.json';
        $cached = is_file($file) ? json_decode((string) file_get_contents($file), true) : null;
        if (is_array($cached) && ($cached['expires'] ?? 0) > time() && isset($cached['certs'][$keyId])) {
            return $cached['certs'][$keyId];
        }
        $response = HttpClient::get(self::CERTS_URL);
        $certs = json_decode($response['body'], true);
        if ($response['status'] !== 200 || !is_array($certs)) {
            throw new ApiError(503, 'Could not reach Google to check the sign-in token. Try again.');
        }
        file_put_contents($file, json_encode(['expires' => time() + 3600, 'certs' => $certs]), LOCK_EX);
        return $certs[$keyId] ?? null;
    }

    private static function base64UrlDecode(string $value): string
    {
        $value = strtr($value, '-_', '+/');
        $value .= str_repeat('=', (4 - strlen($value) % 4) % 4);
        return (string) base64_decode($value, true);
    }
}
