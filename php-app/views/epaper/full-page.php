<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($title) ?></title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <style>
        body { background: #111; margin: 0; }
        .viewer-wrap { position: relative; display: inline-block; }
        .area-map-overlay { position: absolute; cursor: pointer; border: 2px solid rgba(255,200,0,0.6);
                            background: rgba(255,200,0,0.08); transition: background .2s; }
        .area-map-overlay:hover { background: rgba(255,200,0,0.25); }
        #zoomImg { transform-origin: top left; transition: transform .2s; }
    </style>
</head>
<body>
<!-- Navigation bar -->
<div class="d-flex justify-content-between align-items-center px-3 py-2 bg-dark text-white">
    <div class="d-flex align-items-center gap-3">
        <a href="/epaper/view/<?= $edition['id'] ?>" class="btn btn-sm btn-outline-light">
            <i class="bi bi-arrow-left"></i>
        </a>
        <span class="fw-semibold"><?= htmlspecialchars($edition['title']) ?></span>
        <span class="text-secondary">— Page <?= $pageNumber ?> / <?= $totalPages ?></span>
    </div>
    <div class="d-flex gap-2 align-items-center">
        <!-- Zoom controls -->
        <button class="btn btn-sm btn-outline-light" onclick="zoom(-0.25)"><i class="bi bi-zoom-out"></i></button>
        <span id="zoomLevel" class="text-white small">100%</span>
        <button class="btn btn-sm btn-outline-light" onclick="zoom(0.25)"><i class="bi bi-zoom-in"></i></button>

        <!-- Prev / Next -->
        <?php if ($pageNumber > 1): ?>
        <a href="/epaper/full-page/<?= $edition['id'] ?>/<?= $pageNumber - 1 ?>"
           class="btn btn-sm btn-outline-light"><i class="bi bi-chevron-left"></i></a>
        <?php endif; ?>
        <?php if ($pageNumber < $totalPages): ?>
        <a href="/epaper/full-page/<?= $edition['id'] ?>/<?= $pageNumber + 1 ?>"
           class="btn btn-sm btn-outline-light"><i class="bi bi-chevron-right"></i></a>
        <?php endif; ?>
    </div>
</div>

<!-- Page image with area map overlays -->
<div class="text-center overflow-auto" style="height:calc(100vh - 56px)">
    <div class="viewer-wrap" id="viewerWrap">
        <img id="zoomImg" src="<?= htmlspecialchars($page['image_path']) ?>"
             class="img-fluid" alt="Page <?= $pageNumber ?>"
             onload="initOverlays()">

        <?php foreach ($areaMaps as $am): ?>
        <?php $coords = json_decode($am['coords'] ?? '{}', true); ?>
        <?php if (!empty($coords['x'])): ?>
        <a href="/epaper/area-map/<?= $am['id'] ?>"
           class="area-map-overlay"
           title="<?= htmlspecialchars($am['title'] ?? 'View') ?>"
           style="left:<?= $coords['x'] ?>%;top:<?= $coords['y'] ?>%;width:<?= $coords['w'] ?>%;height:<?= $coords['h'] ?>%">
        </a>
        <?php endif; ?>
        <?php endforeach; ?>
    </div>
</div>

<!-- Keyboard navigation -->
<script>
let scale = 1;
function zoom(delta) {
    scale = Math.min(3, Math.max(0.5, scale + delta));
    document.getElementById('zoomImg').style.transform = `scale(${scale})`;
    document.getElementById('zoomLevel').textContent = Math.round(scale * 100) + '%';
}
function initOverlays() {
    // Overlays use % coords so they scale automatically
}
document.addEventListener('keydown', e => {
    <?php if ($pageNumber > 1): ?>
    if (e.key === 'ArrowLeft') location.href = '/epaper/full-page/<?= $edition['id'] ?>/<?= $pageNumber - 1 ?>';
    <?php endif; ?>
    <?php if ($pageNumber < $totalPages): ?>
    if (e.key === 'ArrowRight') location.href = '/epaper/full-page/<?= $edition['id'] ?>/<?= $pageNumber + 1 ?>';
    <?php endif; ?>
});
</script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
