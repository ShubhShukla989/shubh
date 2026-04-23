<div class="d-flex justify-content-between align-items-center mb-4">
    <h5 class="mb-0">Categories</h5>
    <a href="/admin/categories/create" class="btn btn-primary btn-sm">
        <i class="bi bi-plus-lg me-1"></i> New Category
    </a>
</div>

<div class="card border-0 shadow-sm">
    <div class="card-body p-0">
        <table class="table table-hover mb-0">
            <thead class="table-light">
                <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Alias</th>
                    <th>Sort</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($categories as $cat): ?>
                <tr>
                    <td><?= $cat['id'] ?></td>
                    <td><?= htmlspecialchars($cat['name']) ?></td>
                    <td><code><?= htmlspecialchars($cat['alias']) ?></code></td>
                    <td><?= $cat['sort_order'] ?></td>
                    <td>
                        <span class="badge bg-<?= $cat['is_active'] ? 'success' : 'secondary' ?>">
                            <?= $cat['is_active'] ? 'Active' : 'Inactive' ?>
                        </span>
                    </td>
                    <td>
                        <a href="/admin/categories/edit/<?= $cat['id'] ?>" class="btn btn-sm btn-outline-primary">Edit</a>
                        <form method="POST" action="/admin/categories/delete/<?= $cat['id'] ?>" class="d-inline"
                              onsubmit="return confirm('Delete this category?')">
                            <button class="btn btn-sm btn-outline-danger">Delete</button>
                        </form>
                    </td>
                </tr>
                <?php endforeach; ?>
                <?php if (empty($categories)): ?>
                <tr><td colspan="6" class="text-center text-muted py-4">No categories yet.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>
