<?php
// Settings for the PHP backend.
// Copy this file to config.php and fill it in. Each machine (your PC, the host) has its own config.php.
// Never upload config.php to GitHub: it holds passwords and keys.
return [
    // MySQL / MariaDB. These are the XAMPP defaults (user root, no password), fine only on your own PC.
    'db_host' => '127.0.0.1',
    'db_port' => 3306,
    'db_name' => 'cinecompass',
    'db_user' => 'root',
    'db_pass' => '',

    // Filled in later steps.
    'omdb_key' => '',              // free key from omdbapi.com
    'firebase_project_id' => '',   // from the Firebase console, used to check sign-in tokens
    'recent_decay' => 0.9,         // RECENT_DECAY printed by the Colab notebook (stage 9)

    // Websites allowed to call this API from the browser. Add your GitHub Pages address when you deploy,
    // for example 'https://yourname.github.io' (no slash at the end).
    'allowed_origins' => ['http://localhost:5173'],

    // Test without Firebase by sending the header "X-Dev-User: ali". It only works for requests made
    // directly on your own PC. Set true on your PC only; keep false on the real host.
    'dev_auth' => false,
];
