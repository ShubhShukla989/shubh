<div class="container py-3" style="max-width:480px">
    <h5 class="mb-3">Mobile ePaper</h5>

    <?php if (empty($editions)): ?>
    <div class="text-center text-muted py-5">No editions available.</div>
    <?php else: ?>
    <div class="d-flex flex-column gap-3">
        <?php foreach ($editions as $ed): ?>
        <a href="/epaper/mobile/<?= $ed['id'] ?>" class="text-decoration-none text-dark">
            <div class="card border-0 shadow-sm">
                <div class="row g-0">
                    <div class="col-4">
                        <?php if ($ed['cover']): ?>
                        <img src="<?= htmlspecialchars($ed['cover']) ?>"
                             class="img-fluid rounded-start h-100" style="object-fit:cover;max-height:100px;" alt="">
                        <?php else: ?>
                        <div class="d-flex align-items-center justify-content-center h-100 bg-light rounded-start" style="min-height:80px">
                            <i class="bi bi-newspaper text-muted fs-3"></i>
                        </div>
                        <?php endif; ?>
                    </div>
                    <div class="col-8">
                        <div class="card-body py-2 px-3">
                            <h6 class="mb-1 text-truncate"><?= htmlspecialchars($ed['title']) ?></h6>
                            <?php if ($ed['publish_date']): ?>
                            <small class="text-muted"><?= date('d M Y', strtotime($ed['publish_date'])) ?></small>
                            <?php endif; ?>
                            <div class="mt-1">
                                <span class="badge bg-primary">Read</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </a>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>
</div>
