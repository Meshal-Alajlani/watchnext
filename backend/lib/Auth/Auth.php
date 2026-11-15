<?php
declare(strict_types=1);

// Works out who is calling. The React app sends "Authorization: Bearer <Firebase ID token>".
// The first time a Firebase user calls, a row is created for them in the users table.
final class Auth
{
    private ?array $user = null;
    private bool $resolved = false;

    public function __construct(private PDO $db, private array $config)
    {
    }

    // The signed-in user's row, or null when nobody is signed in.
    public function user(): ?array
    {
        if ($this->resolved) {
            return $this->user;
        }
        $this->resolved = true;
        $identity = $this->identity();
        if ($identity === null) {
            return null;
        }
        $find = $this->db->prepare('SELECT * FROM users WHERE firebase_uid = ?');
        $find->execute([$identity['uid']]);
        $user = $find->fetch();
        if (!$user) {
            $this->db->prepare('INSERT IGNORE INTO users (firebase_uid, display_name) VALUES (?, ?)')
                ->execute([$identity['uid'], $identity['name']]);
            $find->execute([$identity['uid']]);
            $user = $find->fetch();
        }
        return $this->user = $user ?: null;
    }

    public function requireUser(): array
    {
        return $this->user() ?? throw new ApiError(401, 'Sign in first');
    }

    /** @return ?array{uid: string, name: ?string} */
    private function identity(): ?array
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? (function_exists('getallheaders') ? (array_change_key_case(getallheaders())['authorization'] ?? '') : '');
        if (preg_match('/^Bearer\s+(\S+)$/i', (string) $header, $m)) {
            $projectId = (string) ($this->config['firebase_project_id'] ?? '');
            if ($projectId === '') {
                throw new ApiError(500, 'firebase_project_id is not set in backend/config.php');
            }
            $claims = (new FirebaseAuth($projectId))->verify($m[1]);
            $name = isset($claims['name']) && is_string($claims['name']) ? mb_substr($claims['name'], 0, 100) : null;
            return ['uid' => $claims['sub'], 'name' => $name];
        }

        // Testing without Firebase: send "X-Dev-User: ali". Only when dev_auth is on AND the request
        // comes straight from this PC (not through ngrok or any proxy), so it can never work on the real host.
        $devUser = (string) ($_SERVER['HTTP_X_DEV_USER'] ?? '');
        if ($devUser !== '' && !empty($this->config['dev_auth']) && self::isDirectLocalRequest()) {
            if (!preg_match('/^[A-Za-z0-9_-]{1,40}$/', $devUser)) {
                throw new ApiError(400, 'X-Dev-User may only contain letters, digits, _ and -');
            }
            return ['uid' => 'dev:' . $devUser, 'name' => $devUser];
        }
        return null;
    }

    private static function isDirectLocalRequest(): bool
    {
        $host = strtolower(preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? '')));
        return in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true)
            && empty($_SERVER['HTTP_X_FORWARDED_FOR'])
            && in_array($host, ['localhost', '127.0.0.1', '[::1]'], true);
    }
}
