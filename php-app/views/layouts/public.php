<?php
// Load site settings once
static $siteSettings = null;
if ($siteSettings === null) {
    $rows = db()->query("SELECT key_name, value FROM settings")->fetchAll();
    $siteSettings = [];
    foreach ($rows as $r) $siteSettings[$r['key_name']] = $r['value'];
}
$siteName = $siteSettings['site_name'] ?? 'ePaper';
$analyticsId = $siteSettings['analytics_id'] ?? '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($title ?? $siteName) ?> | <?= htmlspecialchars($siteName) ?></title>
    <meta name="description" content="<?= htmlspecialchars($metaDesc ?? $siteSettings['site_description'] ?? '') ?>">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <?php if ($analyticsId): ?>
    <script async src="https://www.googletagmanager.com/gtag/js?id=<?= htmlspecialchars($analyticsId) ?>"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','<?= htmlspecialchars($analyticsId) ?>');</script>
    <?php endif; ?>
    <style>
        .navbar-brand { font-weight: 700; }
        .edition-card img { transition: transform .2s; }
        .edition-card:hover img { transform: scale(1.03); }
        .edition-card { overflow: hidden; }
        .page-viewer { background: #1a1a1a; }
    </style>
</head>
<body>
<nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
    <div class="container">
        <a class="navbar-brand" href="/"><?= htmlspecialchars($siteName) ?></a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navMenu">
            <ul class="navbar-nav me-auto">
                <li class="nav-item"><a class="nav-link" href="/epaper/display">Latest</a></li>
                <li class="nav-item"><a class="nav-link" href="/epaper/archive">Archive</a></li>
            </ul>
            <ul class="navbar-nav ms-auto">
                <?php if (isLoggedIn()): ?>
                    <?php if (isAdmin()): ?>
                    <li class="nav-item"><a class="nav-link" href="/admin"><i class="bi bi-gear me-1"></i>Admin</a></li>
                    <?php endif; ?>
                    <li class="nav-item"><a class="nav-link" href="/logout">Logout</a></li>
                <?php else: ?>
                    <li class="nav-item"><a class="nav-link" href="/login">Login</a></li>
                <?php endif; ?>
            </ul>
        </div>
    </div>
</nav>

<main>
    <?php require ROOT . '/views/partials/flash.php'; ?>
    <?= $content ?>
</main>

<footer class="bg-dark text-white py-4 mt-5">
    <div class="container text-center">
        <p class="mb-1">&copy; <?= date('Y') ?> <?= htmlspecialchars($siteName) ?>. All rights reserved.</p>
        <small class="text-muted">Powered by ePaper CMS</small>
    </div>
</footer>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
