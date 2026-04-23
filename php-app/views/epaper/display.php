<div class="container py-4">
    <!-- Category filter tabs -->
    <?php if (!empty($categories)): ?>
    <ul class="nav nav-pills mb-4 flex-wrap gap-1">
        <li class="nav-item">
            <a class="nav-link <?= !isset($_GET['cat']) ? 'active' : '' ?>" href="/epaper/display">All</a>
        </li>
        <?php foreach ($categories as $cat): ?>
        <li class="nav-item">
            <a class="nav-link <?= ($_GET['cat'] ?? '') === $cat['alias'] ? 'active' : '' ?>"
               href="/epaper/category/<?= htmlspecialchars($cat['alias']) ?>">
                <?= htmlspecialchars($cat['name']) ?>
            </a>
        </li>
        <?php endforeach; ?>
    </ul>
    <?php endif; ?>

    <?php if (empty($featured)): ?>
    <div class="text-center text-muted py-5">
        <i class="bi bi-newspaper fs-1 d-block mb-3"></i>
        No editions published yet.
    </div>
    <?php else: ?>
    <div class="row g-4">
        <?php foreach ($featured as $ed): ?>
        <div class="col-6 col-md-4 col-lg-3">
            <a href="/epaper/view/<?= $ed['id'] ?>" class="text-decoration-none text-dark edition-card d-block">
                <div class="card border-0 shadow-sm h-100">
                    <div class="overflow-hidden" style="height:220px;background:#f1f5f9">
                        <?php if ($ed['cover']): ?>
                        <img src="<?= htmlspecialchars($ed['cover']) ?>"
                             class="w-100 h-100" style="object-fit:cover;" alt="<?= htmlspecialchars($ed['title']) ?>">
                        <?php else: ?>
                        <div class="d-flex align-items-center justify-content-center h-100">
                            <i class="bi bi-newspaper text-muted fs-1"></i>
                        </div>
                        <?php endif; ?>
                    </div>
                    <div class="card-body p-3">
                        <h6 class="mb-1 text-truncate"><?= htmlspecialchars($ed['title']) ?></h6>
                        <?php if ($ed['category_name']): ?>
                        <small class="text-muted"><?= htmlspecialchars($ed['category_name']) ?></small>
                        <?php endif; ?>
                        <?php if ($ed['publish_date']): ?>
                        <div class="text-muted mt-1" style="font-size:12px">
                            <i class="bi bi-calendar3 me-1"></i>
                            <?= date('d M Y', strtotime($ed['publish_date'])) ?>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
            </a>
        </div>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>
</div>
