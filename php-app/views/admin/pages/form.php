<div class="mb-4">
    <a href="/admin/pages" class="text-muted text-decoration-none"><i class="bi bi-arrow-left me-1"></i> Back</a>
</div>
<div class="card border-0 shadow-sm">
    <div class="card-body">
        <form method="POST" action="/admin/pages/<?= $page ? 'edit/' . $page['id'] : 'create' ?>">
            <div class="row g-3 mb-3">
                <div class="col-md-6">
                    <label class="form-label">Title <span class="text-danger">*</span></label>
                    <input type="text" name="title" class="form-control"
                           value="<?= htmlspecialchars($page['title'] ?? '') ?>" required
                           oninput="autoAlias(this.value)">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Alias <span class="text-danger">*</span></label>
                    <input type="text" name="alias" id="alias" class="form-control"
                           value="<?= htmlspecialchars($page['alias'] ?? '') ?>" required>
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label">Content</label>
                <textarea name="content" id="content" class="form-control" rows="12"><?= htmlspecialchars($page['content'] ?? '') ?></textarea>
            </div>

            <div class="row g-3 mb-3">
                <div class="col-md-6">
                    <label class="form-label">Meta Title</label>
                    <input type="text" name="meta_title" class="form-control"
                           value="<?= htmlspecialchars($page['meta_title'] ?? '') ?>">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Meta Description</label>
                    <input type="text" name="meta_desc" class="form-control"
                           value="<?= htmlspecialchars($page['meta_desc'] ?? '') ?>">
                </div>
            </div>

            <div class="mb-4">
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" name="is_active" id="is_active"
                           <?= (!isset($page) || $page['is_active']) ? 'checked' : '' ?>>
                    <label class="form-check-label" for="is_active">Active</label>
                </div>
            </div>

            <button type="submit" class="btn btn-primary"><?= $page ? 'Update Page' : 'Create Page' ?></button>
        </form>
    </div>
</div>

<!-- TinyMCE CDN (free) -->
<script src="https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js" referrerpolicy="origin"></script>
<script>
tinymce.init({
    selector: '#content',
    plugins: 'link image lists table code',
    toolbar: 'undo redo | bold italic | alignleft aligncenter alignright | bullist numlist | link image | code',
    height: 400,
});
function autoAlias(val) {
    const f = document.getElementById('alias');
    if (!f.dataset.edited) {
        f.value = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
}
document.getElementById('alias').addEventListener('input', function() { this.dataset.edited = '1'; });
</script>
