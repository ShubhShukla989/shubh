<div class="d-flex justify-content-between align-items-center mb-4">
    <h5 class="mb-0">Static Pages</h5>
    <a href="/admin/pages/create" class="btn btn-primary btn-sm"><i class="bi bi-plus-lg me-1"></i> New Page</a>
</div>
<div class="card border-0 shadow-sm">
    <div class="card-body p-0">
        <table class="table table-hover mb-0">
            <thead class="table-light">
                <tr><th>Title</th><th>Alias</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
                <?php foreach ($pages as $p): ?>
                <tr>
                    <td><?= htmlspecialchars($p['title']) ?></td>
                    <td><code><?= htmlspecialchars($p['alias']) ?></code></td>
                    <td><span class="badge bg-<?= $p['is_active'] ? 'success' : 'secondary' ?>"><?= $p['is_active'] ? 'Active' : 'Inactive' ?></span></td>
                    <td>
                        <a href="/admin/pages/edit/<?= $p['id'] ?>" class="btn btn-sm btn-outline-primary">Edit</a>
                        <a href="/page/<?= htmlspecialchars($p['alias']) ?>" target="_blank" class="btn btn-sm btn-outline-secondary">View</a>
                        <form method="POST" action="/admin/pages/delete/<?= $p['id'] ?>" class="d-inline"
                              onsubmit="return confirm('Delete this page?')">
                            <button class="btn btn-sm btn-outline-danger">Delete</button>
                        </form>
                    </td>
                </tr>
                <?php endforeach; ?>
                <?php if (empty($pages)): ?>
                <tr><td colspan="4" class="text-center text-muted py-4">No pages yet.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>
