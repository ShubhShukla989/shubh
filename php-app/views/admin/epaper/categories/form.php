<div class="mb-4">
    <a href="/admin/epaper/categories" class="text-muted text-decoration-none"><i class="bi bi-arrow-left me-1"></i> Back</a>
</div>
<div class="card border-0 shadow-sm" style="max-width:500px">
    <div class="card-body">
        <form method="POST" action="/admin/epaper/categories/<?= $category ? 'edit/' . $category['id'] : 'create' ?>">
            <div class="mb-3">
                <label class="form-label">Name</label>
                <input type="text" name="name" class="form-control"
                       value="<?= htmlspecialchars($category['name'] ?? '') ?>" required
                       oninput="document.getElementById('alias').value=this.value.toLowerCase().replace(/[^a-z0-9]+/g,'-')">
            </div>
            <div class="mb-3">
                <label class="form-label">Alias</label>
                <input type="text" name="alias" id="alias" class="form-control"
                       value="<?= htmlspecialchars($category['alias'] ?? '') ?>" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Sort Order</label>
                <input type="number" name="sort_order" class="form-control" style="width:120px"
                       value="<?= $category['sort_order'] ?? 0 ?>">
            </div>
            <div class="mb-4">
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" name="is_active"
                           <?= (!isset($category) || $category['is_active']) ? 'checked' : '' ?>>
                    <label class="form-check-label">Active</label>
                </div>
            </div>
            <button class="btn btn-primary"><?= $category ? 'Update' : 'Create' ?></button>
        </form>
    </div>
</div>
