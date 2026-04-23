<div class="mb-3">
    <a href="/admin/menus" class="text-muted text-decoration-none"><i class="bi bi-arrow-left me-1"></i> Back to Menus</a>
</div>
<div class="row g-4">
    <div class="col-md-4">
        <div class="card border-0 shadow-sm">
            <div class="card-body">
                <h6>Add Item</h6>
                <form method="POST" action="/admin/menus/<?= $menu['id'] ?>/items/store">
                    <div class="mb-2">
                        <label class="form-label small">Label</label>
                        <input type="text" name="label" class="form-control" required>
                    </div>
                    <div class="mb-2">
                        <label class="form-label small">URL</label>
                        <input type="text" name="url" class="form-control" placeholder="/page/about">
                    </div>
                    <div class="mb-2">
                        <label class="form-label small">Parent</label>
                        <select name="parent_id" class="form-select">
                            <option value="">— Top Level —</option>
                            <?php foreach ($items as $item): ?>
                            <?php if (!$item['parent_id']): ?>
                            <option value="<?= $item['id'] ?>"><?= htmlspecialchars($item['label']) ?></option>
                            <?php endif; ?>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small">Sort Order</label>
                        <input type="number" name="sort_order" class="form-control" value="0">
                    </div>
                    <button class="btn btn-primary w-100">Add Item</button>
                </form>
            </div>
        </div>
    </div>
    <div class="col-md-8">
        <div class="card border-0 shadow-sm">
            <div class="card-body p-0">
                <table class="table mb-0">
                    <thead class="table-light"><tr><th>Label</th><th>URL</th><th>Parent</th><th>Sort</th><th></th></tr></thead>
                    <tbody>
                        <?php foreach ($items as $item): ?>
                        <tr>
                            <td><?= $item['parent_id'] ? '&nbsp;&nbsp;↳ ' : '' ?><?= htmlspecialchars($item['label']) ?></td>
                            <td><small><?= htmlspecialchars($item['url'] ?? '') ?></small></td>
                            <td><?= $item['parent_id'] ?: '—' ?></td>
                            <td><?= $item['sort_order'] ?></td>
                            <td>
                                <form method="POST" action="/admin/menus/<?= $menu['id'] ?>/items/<?= $item['id'] ?>/delete"
                                      onsubmit="return confirm('Delete item?')">
                                    <button class="btn btn-sm btn-outline-danger">Delete</button>
                                </form>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
