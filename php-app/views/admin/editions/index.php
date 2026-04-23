<div class="d-flex justify-content-between align-items-center mb-4">
    <h5 class="mb-0">Editions</h5>
    <a href="/admin/editions/create" class="btn btn-primary btn-sm">
        <i class="bi bi-plus-lg me-1"></i> New Edition
    </a>
</div>

<div class="card border-0 shadow-sm">
    <div class="card-body p-0">
        <table class="table table-hover mb-0">
            <thead class="table-light">
                <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Publish Date</th>
                    <th>Status</th>
                    <th>PDF</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($editions as $ed): ?>
                <tr>
                    <td><?= $ed['id'] ?></td>
                    <td><?= htmlspecialchars($ed['title']) ?></td>
                    <td><?= htmlspecialchars($ed['category_name'] ?? '—') ?></td>
                    <td><?= $ed['publish_date'] ?? '—' ?></td>
                    <td>
                        <span class="badge bg-<?= $ed['status'] === 'published' ? 'success' : ($ed['status'] === 'draft' ? 'secondary' : 'warning') ?>">
                            <?= ucfirst($ed['status']) ?>
                        </span>
                    </td>
                    <td>
                        <?php if ($ed['pdf_path']): ?>
                            <a href="<?= htmlspecialchars($ed['pdf_path']) ?>" target="_blank" class="text-success">
                                <i class="bi bi-file-pdf"></i> PDF
                            </a>
                        <?php else: ?>
                            <span class="text-muted">—</span>
                        <?php endif; ?>
                    </td>
                    <td class="d-flex gap-1 flex-wrap">
                        <a href="/admin/editions/<?= $ed['id'] ?>/edit" class="btn btn-sm btn-outline-primary">Edit</a>
                        <a href="/admin/editions/<?= $ed['id'] ?>/pages" class="btn btn-sm btn-outline-secondary">Pages</a>
                        <form method="POST" action="/admin/editions/<?= $ed['id'] ?>/extract" class="d-inline">
                            <button class="btn btn-sm btn-outline-info" title="Re-extract pages from PDF">
                                <i class="bi bi-file-earmark-break"></i> Extract
                            </button>
                        </form>
                        <form method="POST" action="/admin/editions/delete/<?= $ed['id'] ?>" class="d-inline"
                              onsubmit="return confirm('Delete this edition and all its pages?')">
                            <button class="btn btn-sm btn-outline-danger">Delete</button>
                        </form>
                    </td>
                </tr>
                <?php endforeach; ?>
                <?php if (empty($editions)): ?>
                <tr><td colspan="7" class="text-center text-muted py-4">No editions yet.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>
