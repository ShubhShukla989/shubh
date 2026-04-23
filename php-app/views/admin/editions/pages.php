<div class="d-flex justify-content-between align-items-center mb-4">
    <div>
        <a href="/admin/editions" class="text-muted text-decoration-none">
            <i class="bi bi-arrow-left me-1"></i> Back
        </a>
        <h5 class="mb-0 mt-1"><?= htmlspecialchars($edition['title']) ?> — Pages</h5>
    </div>
    <div class="d-flex gap-2">
        <?php if ($edition['pdf_path']): ?>
        <form method="POST" action="/admin/editions/<?= $edition['id'] ?>/extract">
            <button class="btn btn-info btn-sm text-white">
                <i class="bi bi-file-earmark-break me-1"></i> Re-extract Pages
            </button>
        </form>
        <?php endif; ?>
        <a href="/admin/editions/<?= $edition['id'] ?>/edit" class="btn btn-outline-secondary btn-sm">
            Edit Edition
        </a>
    </div>
</div>

<?php if (empty($pages)): ?>
<div class="alert alert-info">
    No pages extracted yet.
    <?= $edition['pdf_path'] ? 'Click "Re-extract Pages" to extract from the uploaded PDF.' : 'Upload a PDF first.' ?>
</div>
<?php else: ?>
<div class="row g-3">
    <?php foreach ($pages as $page): ?>
    <div class="col-6 col-md-3 col-lg-2">
        <div class="card border-0 shadow-sm h-100">
            <div class="position-relative">
                <img src="<?= htmlspecialchars($page['thumb_path'] ?: $page['image_path']) ?>"
                     class="card-img-top" style="height:160px;object-fit:cover;"
                     alt="Page <?= $page['page_number'] ?>">
                <span class="position-absolute top-0 start-0 badge bg-dark m-1">
                    <?= $page['page_number'] ?>
                </span>
            </div>
            <div class="card-body p-2 text-center">
                <a href="<?= htmlspecialchars($page['image_path']) ?>" target="_blank"
                   class="btn btn-xs btn-outline-secondary btn-sm w-100 mb-1">
                    <i class="bi bi-zoom-in"></i> View
                </a>
                <form method="POST"
                      action="/admin/editions/<?= $edition['id'] ?>/pages/<?= $page['id'] ?>/delete"
                      onsubmit="return confirm('Delete page <?= $page['page_number'] ?>?')">
                    <button class="btn btn-sm btn-outline-danger w-100">
                        <i class="bi bi-trash"></i>
                    </button>
                </form>
            </div>
        </div>
    </div>
    <?php endforeach; ?>
</div>
<div class="mt-3 text-muted small"><?= count($pages) ?> pages total</div>
<?php endif; ?>
