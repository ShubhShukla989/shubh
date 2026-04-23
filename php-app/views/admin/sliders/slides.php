<div class="mb-3">
    <a href="/admin/sliders" class="text-muted text-decoration-none"><i class="bi bi-arrow-left me-1"></i> Back</a>
</div>
<div class="row g-4">
    <div class="col-md-4">
        <div class="card border-0 shadow-sm">
            <div class="card-body">
                <h6>Add Slide</h6>
                <form method="POST" action="/admin/sliders/<?= $slider['id'] ?>/slides/store" enctype="multipart/form-data">
                    <div class="mb-2">
                        <label class="form-label small">Image</label>
                        <input type="file" name="image" class="form-control" accept="image/*" required>
                    </div>
                    <div class="mb-2">
                        <label class="form-label small">Title</label>
                        <input type="text" name="title" class="form-control">
                    </div>
                    <div class="mb-2">
                        <label class="form-label small">Link URL</label>
                        <input type="text" name="url" class="form-control">
                    </div>
                    <div class="mb-3">
                        <label class="form-label small">Sort Order</label>
                        <input type="number" name="sort_order" class="form-control" value="<?= count($slides) ?>">
                    </div>
                    <button class="btn btn-primary w-100">Add Slide</button>
                </form>
            </div>
        </div>
    </div>
    <div class="col-md-8">
        <div class="row g-3">
            <?php foreach ($slides as $slide): ?>
            <div class="col-6">
                <div class="card border-0 shadow-sm">
                    <?php if ($slide['image_path']): ?>
                    <img src="<?= htmlspecialchars($slide['image_path']) ?>" class="card-img-top"
                         style="height:140px;object-fit:cover;">
                    <?php endif; ?>
                    <div class="card-body p-2">
                        <p class="small mb-1"><?= htmlspecialchars($slide['title'] ?? '—') ?></p>
                        <p class="text-muted" style="font-size:11px"><?= htmlspecialchars($slide['url'] ?? '') ?></p>
                        <form method="POST" action="/admin/sliders/<?= $slider['id'] ?>/slides/<?= $slide['id'] ?>/delete"
                              onsubmit="return confirm('Delete slide?')">
                            <button class="btn btn-sm btn-outline-danger w-100">Delete</button>
                        </form>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>
</div>
