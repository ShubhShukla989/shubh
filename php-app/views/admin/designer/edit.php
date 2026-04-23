<div class="mb-4">
    <a href="/admin/designer" class="text-muted text-decoration-none"><i class="bi bi-arrow-left me-1"></i> Back</a>
</div>

<div class="card border-0 shadow-sm" style="max-width:600px">
    <div class="card-body">
        <h6 class="mb-3">Header</h6>
        <div class="mb-3 d-flex gap-4">
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="show_logo"
                       <?= !empty($layout['header']['show_logo']) ? 'checked' : '' ?>>
                <label class="form-check-label" for="show_logo">Show Logo</label>
            </div>
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="show_nav"
                       <?= !empty($layout['header']['show_nav']) ? 'checked' : '' ?>>
                <label class="form-check-label" for="show_nav">Show Navigation</label>
            </div>
        </div>

        <h6 class="mb-3">Footer</h6>
        <div class="mb-3">
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="show_links"
                       <?= !empty($layout['footer']['show_links']) ? 'checked' : '' ?>>
                <label class="form-check-label" for="show_links">Show Footer Links</label>
            </div>
        </div>

        <h6 class="mb-3">Sidebar</h6>
        <div class="mb-3">
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="sidebar_enabled"
                       <?= !empty($layout['sidebar']['enabled']) ? 'checked' : '' ?>>
                <label class="form-check-label" for="sidebar_enabled">Enable Sidebar</label>
            </div>
        </div>

        <h6 class="mb-3">Colors</h6>
        <div class="row g-3 mb-4">
            <div class="col-md-6">
                <label class="form-label">Primary Color</label>
                <input type="color" id="color_primary" class="form-control form-control-color"
                       value="<?= htmlspecialchars($layout['colors']['primary'] ?? '#0d6efd') ?>">
            </div>
            <div class="col-md-6">
                <label class="form-label">Background Color</label>
                <input type="color" id="color_bg" class="form-control form-control-color"
                       value="<?= htmlspecialchars($layout['colors']['bg'] ?? '#ffffff') ?>">
            </div>
        </div>

        <button class="btn btn-primary" onclick="saveLayout()">Save Layout</button>
        <span id="saveStatus" class="ms-3 text-muted small"></span>
    </div>
</div>

<script>
async function saveLayout() {
    const data = {
        header:  { show_logo: document.getElementById('show_logo').checked, show_nav: document.getElementById('show_nav').checked },
        footer:  { show_links: document.getElementById('show_links').checked },
        sidebar: { enabled: document.getElementById('sidebar_enabled').checked },
        colors:  { primary: document.getElementById('color_primary').value, bg: document.getElementById('color_bg').value },
    };
    const res = await fetch('/admin/designer/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    document.getElementById('saveStatus').textContent = res.ok ? '✅ Saved' : '❌ Failed';
}
</script>
