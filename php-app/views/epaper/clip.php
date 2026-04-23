<div class="container py-4" style="max-width:800px">
    <div class="mb-3">
        <a href="javascript:history.back()" class="text-muted text-decoration-none">
            <i class="bi bi-arrow-left me-1"></i> Back
        </a>
    </div>

    <div class="card border-0 shadow-sm">
        <div class="card-body">
            <h5 class="mb-1"><?= htmlspecialchars($clip['title'] ?? 'Clip') ?></h5>
            <?php if ($clip['edition_title']): ?>
            <p class="text-muted small mb-3">From: <?= htmlspecialchars($clip['edition_title']) ?></p>
            <?php endif; ?>

            <?php if ($clip['image_path']): ?>
            <img src="<?= htmlspecialchars($clip['image_path']) ?>"
                 class="img-fluid w-100 rounded mb-3" alt="<?= htmlspecialchars($clip['title'] ?? '') ?>">
            <?php else: ?>
            <div class="text-center text-muted py-5">No image for this clip.</div>
            <?php endif; ?>

            <div class="d-flex gap-2 flex-wrap">
                <?php if ($clip['image_path']): ?>
                <a href="<?= htmlspecialchars($clip['image_path']) ?>" download class="btn btn-outline-primary">
                    <i class="bi bi-download me-1"></i> Download
                </a>
                <?php endif; ?>
                <button class="btn btn-outline-secondary" onclick="copyLink()">
                    <i class="bi bi-share me-1"></i> Copy Link
                </button>
                <a href="https://wa.me/?text=<?= urlencode(($clip['title'] ?? 'Clip') . ' ' . (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']) ?>"
                   target="_blank" class="btn btn-success">
                    <i class="bi bi-whatsapp me-1"></i> WhatsApp
                </a>
            </div>
        </div>
    </div>
</div>

<script>
function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => alert('Link copied!'));
}
</script>
