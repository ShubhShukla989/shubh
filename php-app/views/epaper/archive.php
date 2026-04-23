<div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">Archive</h4>
    </div>

    <!-- Filters -->
    <form class="d-flex gap-2 mb-4 flex-wrap" method="GET">
        <select name="category" class="form-select" style="max-width:200px" onchange="this.form.submit()">
            <option value="">All Categories</option>
            <?php foreach ($categories as $cat): ?>
            <option value="<?= $cat['id'] ?>" <?= $categoryId == $cat['id'] ? 'selected' : '' ?>>
                <?= htmlspecialchars($cat['name']) ?>
            </option>
            <?php endforeach; ?>
        </select>
        <?php if ($categoryId): ?>
        <a href="/epaper/archive" class="btn btn-outline-secondary">Clear</a>
        <?php endif; ?>
    </form>

    <?php if (empty($editions)): ?>
    <div class="text-center text-muted py-5">No editions found.</div>
    <?php else: ?>
    <div class="row g-4">
        <?php foreach ($editions as $ed): ?>
        <div class="col-6 col-md-4 col-lg-3">
            <a href="/epaper/view/<?= $ed['id'] ?>" class="text-decoration-none text-dark edition-card d-block">
                <div class="card border-0 shadow-sm h-100">
                    <div class="overflow-hidden" style="height:200px;background:#f1f5f9">
                        <?php if ($ed['cover']): ?>
                        <img src="<?= htmlspecialchars($ed['cover']) ?>"
                             class="w-100 h-100" style="object-fit:cover;" alt="">
                        <?php else: ?>
                        <div class="d-flex align-items-center justify-content-center h-100">
                            <i class="bi bi-newspaper text-muted fs-1"></i>
                        </div>
                        <?php endif; ?>
                    </div>
                    <div class="card-body p-3">
                        <h6 class="mb-1 text-truncate"><?= htmlspecialchars($ed['title']) ?></h6>
                        <?php if ($ed['publish_date']): ?>
                        <small class="text-muted"><?= date('d M Y', strtotime($ed['publish_date'])) ?></small>
                        <?php endif; ?>
                    </div>
                </div>
            </a>
        </div>
        <?php endforeach; ?>
    </div>

    <!-- Pagination -->
    <?php if ($totalPages > 1): ?>
    <nav class="mt-4">
        <ul class="pagination justify-content-center">
            <?php for ($i = 1; $i <= $totalPages; $i++): ?>
            <li class="page-item <?= $i === $page ? 'active' : '' ?>">
                <a class="page-link" href="?page=<?= $i ?><?= $categoryId ? '&category=' . $categoryId : '' ?>">
                    <?= $i ?>
                </a>
            </li>
            <?php endfor; ?>
        </ul>
    </nav>
    <?php endif; ?>
    <?php endif; ?>
</div>
