<div class="page-viewer min-vh-100">
    <div class="container-fluid py-3">
        <!-- Top bar -->
        <div class="d-flex justify-content-between align-items-center mb-3 px-2">
            <div>
                <a href="/epaper/display" class="btn btn-sm btn-outline-light me-2">
                    <i class="bi bi-arrow-left"></i>
                </a>
                <span class="text-white fw-semibold"><?= htmlspecialchars($edition['title']) ?></span>
                <?php if ($edition['publish_date']): ?>
                <small class="text-secondary ms-2"><?= date('d M Y', strtotime($edition['publish_date'])) ?></small>
                <?php endif; ?>
            </div>
            <div class="d-flex gap-2">
                <?php if ($edition['pdf_path']): ?>
                <a href="<?= htmlspecialchars($edition['pdf_path']) ?>" download
                   class="btn btn-sm btn-outline-light">
                    <i class="bi bi-download me-1"></i>PDF
                </a>
                <?php endif; ?>
                <a href="/epaper/mobile/<?= $edition['id'] ?>" class="btn btn-sm btn-outline-light">
                    <i class="bi bi-phone me-1"></i>Mobile
                </a>
            </div>
        </div>

        <?php if (empty($pages)): ?>
        <div class="text-center text-secondary py-5">
            <i class="bi bi-file-earmark-x fs-1 d-block mb-3"></i>
            No pages available for this edition.
        </div>
        <?php else: ?>

        <!-- Page viewer with thumbnails -->
        <div class="row g-0">
            <!-- Thumbnail strip -->
            <div class="col-auto d-none d-md-block" style="width:120px;overflow-y:auto;max-height:80vh">
                <?php foreach ($pages as $pg): ?>
                <a href="#page-<?= $pg['page_number'] ?>" class="d-block mb-2 text-center text-decoration-none">
                    <img src="<?= htmlspecialchars($pg['thumb_path'] ?: $pg['image_path']) ?>"
                         class="img-fluid rounded border border-secondary"
                         alt="Page <?= $pg['page_number'] ?>">
                    <small class="text-secondary"><?= $pg['page_number'] ?></small>
                </a>
                <?php endforeach; ?>
            </div>

            <!-- Main pages -->
            <div class="col">
                <?php foreach ($pages as $pg): ?>
                <div id="page-<?= $pg['page_number'] ?>" class="mb-3 text-center position-relative">
                    <a href="/epaper/full-page/<?= $edition['id'] ?>/<?= $pg['page_number'] ?>">
                        <img src="<?= htmlspecialchars($pg['image_path']) ?>"
                             class="img-fluid shadow"
                             style="max-height:90vh;cursor:zoom-in;"
                             alt="Page <?= $pg['page_number'] ?>">
                    </a>
                    <div class="text-secondary mt-1 small">Page <?= $pg['page_number'] ?></div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>
    </div>
</div>
