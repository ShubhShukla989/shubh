<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($title ?? 'Admin') ?> | ePaper CMS</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <style>
        body { overflow-x: hidden; }
        .sidebar { width: 250px; min-height: 100vh; background: #1e293b; flex-shrink: 0; }
        .sidebar a { color: #94a3b8; text-decoration: none; display: block; padding: 10px 20px; font-size: 14px; }
        .sidebar a:hover, .sidebar a.active { background: #334155; color: #fff; }
        .sidebar .nav-section { color: #64748b; font-size: 11px; padding: 15px 20px 5px; text-transform: uppercase; letter-spacing: .05em; }
        .main-content { flex: 1; min-width: 0; background: #f8fafc; }
        .topbar { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 12px 24px; }
    </style>
</head>
<body>
<div class="d-flex">
    <div class="sidebar">
        <div class="p-4 border-bottom border-secondary">
            <h5 class="text-white mb-0">ePaper CMS</h5>
        </div>
        <nav class="mt-2">
            <?php
            $currentUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            function navLink(string $href, string $icon, string $label, string $current): void {
                $active = ($current === $href || str_starts_with($current, $href . '/')) ? 'active' : '';
                echo "<a href=\"$href\" class=\"$active\"><i class=\"bi bi-$icon me-2\"></i>$label</a>";
            }
            ?>
            <div class="nav-section">Main</div>
            <?php navLink('/admin', 'speedometer2', 'Dashboard', $currentUri) ?>

            <div class="nav-section">Epaper</div>
            <?php navLink('/admin/editions', 'newspaper', 'Editions', $currentUri) ?>
            <?php navLink('/admin/categories', 'folder', 'Categories', $currentUri) ?>
            <?php navLink('/admin/epaper/categories', 'tags', 'Epaper Categories', $currentUri) ?>
            <?php navLink('/admin/epaper/featured-editions', 'star', 'Featured Editions', $currentUri) ?>
            <?php navLink('/admin/epaper/featured-categories', 'star-fill', 'Featured Categories', $currentUri) ?>

            <div class="nav-section">Content</div>
            <?php navLink('/admin/pages', 'file-text', 'Pages', $currentUri) ?>
            <?php navLink('/admin/menus', 'list', 'Menus', $currentUri) ?>
            <?php navLink('/admin/sliders', 'images', 'Sliders', $currentUri) ?>
            <?php navLink('/admin/media', 'image', 'Media', $currentUri) ?>
            <?php navLink('/admin/designer', 'palette', 'Designer', $currentUri) ?>

            <div class="nav-section">System</div>
            <?php navLink('/admin/users', 'people', 'Users', $currentUri) ?>
            <?php navLink('/admin/users/permissions', 'shield', 'Permissions', $currentUri) ?>
            <?php navLink('/admin/system/settings', 'gear', 'Settings', $currentUri) ?>
            <?php navLink('/admin/cache', 'lightning', 'Cache', $currentUri) ?>
        </nav>
    </div>

    <div class="main-content w-100">
        <div class="topbar d-flex justify-content-between align-items-center">
            <h6 class="mb-0"><?= htmlspecialchars($title ?? 'Dashboard') ?></h6>
            <div class="d-flex align-items-center gap-3">
                <span class="text-muted small"><?= htmlspecialchars(auth()['name'] ?? '') ?></span>
                <a href="/logout" class="btn btn-sm btn-outline-danger">Logout</a>
            </div>
        </div>
        <div class="p-4">
            <?php if (!empty($_SESSION['flash'])): ?>
                <div class="alert alert-<?= htmlspecialchars($_SESSION['flash']['type']) ?> alert-dismissible fade show" role="alert">
                    <?= htmlspecialchars($_SESSION['flash']['msg']) ?>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
                <?php unset($_SESSION['flash']); ?>
            <?php endif; ?>
            <?= $content ?>
        </div>
    </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
