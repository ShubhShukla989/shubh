<div class="row g-4 mb-4">
    <div class="col-md-3">
        <div class="card border-0 shadow-sm">
            <div class="card-body d-flex align-items-center gap-3">
                <div class="bg-primary bg-opacity-10 p-3 rounded">
                    <i class="bi bi-newspaper text-primary fs-4"></i>
                </div>
                <div>
                    <div class="text-muted small">Editions</div>
                    <div class="fs-4 fw-bold"><?= $stats['editions'] ?></div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card border-0 shadow-sm">
            <div class="card-body d-flex align-items-center gap-3">
                <div class="bg-success bg-opacity-10 p-3 rounded">
                    <i class="bi bi-folder text-success fs-4"></i>
                </div>
                <div>
                    <div class="text-muted small">Categories</div>
                    <div class="fs-4 fw-bold"><?= $stats['categories'] ?></div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card border-0 shadow-sm">
            <div class="card-body d-flex align-items-center gap-3">
                <div class="bg-warning bg-opacity-10 p-3 rounded">
                    <i class="bi bi-image text-warning fs-4"></i>
                </div>
                <div>
                    <div class="text-muted small">Media Files</div>
                    <div class="fs-4 fw-bold"><?= $stats['media'] ?></div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card border-0 shadow-sm">
            <div class="card-body d-flex align-items-center gap-3">
                <div class="bg-info bg-opacity-10 p-3 rounded">
                    <i class="bi bi-people text-info fs-4"></i>
                </div>
                <div>
                    <div class="text-muted small">Users</div>
                    <div class="fs-4 fw-bold"><?= $stats['users'] ?></div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="card border-0 shadow-sm">
    <div class="card-header bg-white fw-semibold">Recent Editions</div>
    <div class="card-body p-0">
        <table class="table table-hover mb-0">
            <thead class="table-light">
                <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Publish Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($recent as $edition): ?>
                <tr>
                    <td><?= htmlspecialchars($edition['title']) ?></td>
                    <td>
                        <span class="badge bg-<?= $edition['status'] === 'published' ? 'success' : ($edition['status'] === 'draft' ? 'secondary' : 'warning') ?>">
                            <?= ucfirst($edition['status']) ?>
                        </span>
                    </td>
                    <td><?= $edition['publish_date'] ?? '-' ?></td>
                    <td>
                        <a href="/admin/editions/<?= $edition['id'] ?>/edit" class="btn btn-sm btn-outline-primary">Edit</a>
                        <a href="/admin/editions/<?= $edition['id'] ?>/pages" class="btn btn-sm btn-outline-secondary">Pages</a>
                    </td>
                </tr>
                <?php endforeach; ?>
                <?php if (empty($recent)): ?>
                <tr><td colspan="4" class="text-center text-muted py-4">No editions yet.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>
