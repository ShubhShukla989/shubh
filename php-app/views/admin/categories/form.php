<div class="mb-4">
    <a href="/admin/categories" class="text-muted text-decoration-none">
        <i class="bi bi-arrow-left me-1"></i> Back to Categories
    </a>
</div>

<div class="card border-0 shadow-sm" style="max-width:600px">
    <div class="card-body">
        <form method="POST" action="/admin/categories/<?= $category ? 'edit/' . $category['id'] : 'create' ?>">
            <div class="mb-3">
                <label class="form-label">Name <span class="text-danger">*</span></label>
                <input type="text" name="name" class="form-control"
                       value="<?= htmlspecialchars($category['name'] ?? '') ?>" required
                       oninput="autoAlias(this.value)">
            </div>
            <div class="mb-3">
                <label class="form-label">Alias <span class="text-danger">*</span></label>
                <input type="text" name="alias" id="alias" class="form-control"
                       value="<?= htmlspecialchars($category['alias'] ?? '') ?>" required>
                <div class="form-text">URL-friendly identifier. Auto-generated from name.</div>
            </div>
            <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea name="description" class="form-control" rows="3"><?= htmlspecialchars($category['description'] ?? '') ?></textarea>
            </div>
            <div class="mb-3">
                <label class="form-label">Sort Order</label>
                <input type="number" name="sort_order" class="form-control" style="width:120px"
                       value="<?= $category['sort_order'] ?? 0 ?>">
            </div>
            <div class="mb-4">
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" name="is_active" id="is_active"
                           <?= (!isset($category) || $category['is_active']) ? 'checked' : '' ?>>
                    <label class="form-check-label" for="is_active">Active</label>
                </div>
            </div>
            <button type="submit" class="btn btn-primary">
                <?= $category ? 'Update Category' : 'Create Category' ?>
            </button>
        </form>
    </div>
</div>

<script>
function autoAlias(val) {
    const aliasField = document.getElementById('alias');
    if (!aliasField.dataset.edited) {
        aliasField.value = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
}
document.getElementById('alias').addEventListener('input', function() {
    this.dataset.edited = '1';
});
</script>
