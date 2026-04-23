<?php
// Secure session config — must be set before session_start()
ini_set('session.cookie_httponly', '1');
ini_set('session.use_strict_mode', '1');
ini_set('session.cookie_samesite', 'Lax');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function auth(): ?array {
    return $_SESSION['user'] ?? null;
}

function isLoggedIn(): bool {
    return isset($_SESSION['user']);
}

function isAdmin(): bool {
    return isset($_SESSION['user']) && in_array($_SESSION['user']['role'], ['admin', 'superadmin']);
}

function requireLogin(): void {
    if (!isLoggedIn()) {
        header('Location: /login');
        exit;
    }
}

function requireAdmin(): void {
    if (!isAdmin()) {
        header('Location: /login');
        exit;
    }
}
