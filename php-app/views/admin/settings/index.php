<div class="card border-0 shadow-sm" style="max-width:700px">
    <div class="card-body">
        <form method="POST" action="/admin/system/settings">
            <h6 class="text-muted mb-3">Site</h6>
            <div class="row g-3 mb-4">
                <div class="col-md-6">
                    <label class="form-label">Site Name</label>
                    <input type="text" name="site_name" class="form-control" value="<?= htmlspecialchars($settings['site_name'] ?? '') ?>">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Site URL</label>
                    <input type="text" name="site_url" class="form-control" value="<?= htmlspecialchars($settings['site_url'] ?? '') ?>">
                </div>
                <div class="col-12">
                    <label class="form-label">Site Description</label>
                    <input type="text" name="site_description" class="form-control" value="<?= htmlspecialchars($settings['site_description'] ?? '') ?>">
                </div>
                <div class="col-12">
                    <label class="form-label">Default OG Image URL</label>
                    <input type="text" name="og_image" class="form-control" value="<?= htmlspecialchars($settings['og_image'] ?? '') ?>">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Homepage Path</label>
                    <input type="text" name="homepage" class="form-control" value="<?= htmlspecialchars($settings['homepage'] ?? '/epaper/display') ?>">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Analytics ID (GA)</label>
                    <input type="text" name="analytics_id" class="form-control" placeholder="G-XXXXXXXXXX" value="<?= htmlspecialchars($settings['analytics_id'] ?? '') ?>">
                </div>
            </div>

            <h6 class="text-muted mb-3">SEO</h6>
            <div class="mb-4">
                <label class="form-label">robots.txt content</label>
                <textarea name="robots_txt" class="form-control font-monospace" rows="5"><?= htmlspecialchars($settings['robots_txt'] ?? "User-agent: *\nAllow: /") ?></textarea>
            </div>
            <div class="mb-4">
                <label class="form-label">ads.txt content</label>
                <textarea name="ads_txt" class="form-control font-monospace" rows="3"><?= htmlspecialchars($settings['ads_txt'] ?? '') ?></textarea>
            </div>

            <button type="submit" class="btn btn-primary">Save Settings</button>
        </form>
    </div>
</div>
