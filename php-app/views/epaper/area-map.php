<div class="container py-4">
    <div class="mb-3">
        <a href="javascript:history.back()" class="text-muted text-decoration-none">
            <i class="bi bi-arrow-left me-1"></i> Back
        </a>
    </div>

    <div class="row g-4">
        <div class="col-lg-8">
            <div class="card border-0 shadow-sm">
                <div class="card-body p-2">
                    <?php if ($areaMap['watermark_path'] ?: $areaMap['image_path']): ?>
                    <img src="<?= htmlspecialchars($areaMap['watermark_path'] ?: $areaMap['image_path']) ?>"
                         class="img-fluid w-100" alt="<?= htmlspecialchars($areaMap['title'] ?? '') ?>">
                    <?php else: ?>
                    <div class="text-center text-muted py-5">No image available.</div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        <div class="col-lg-4">
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <h5><?= htmlspecialchars($areaMap['title'] ?? 'Area Map') ?></h5>
                    <p class="text-muted small">From: <?= htmlspecialchars($areaMap['edition_title']) ?></p>

                    <div class="d-flex flex-column gap-2 mt-3">
                        <?php if ($areaMap['image_path']): ?>
                        <a href="<?= htmlspecialchars($areaMap['image_path']) ?>" download
                           class="btn btn-outline-primary">
                            <i class="bi bi-download me-1"></i> Download Image
                        </a>
                        <?php endif; ?>

                        <!-- Share buttons -->
                        <button class="btn btn-outline-secondary" onclick="copyLink()">
                            <i class="bi bi-share me-1"></i> Copy Link
                        </button>
                        <a href="https://wa.me/?text=<?= urlencode($areaMap['title'] . ' ' . (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']) ?>"
                           target="_blank" class="btn btn-success">
                            <i class="bi bi-whatsapp me-1"></i> Share on WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => alert('Link copied!'));
}
</script>
