<div class="row g-4 mb-4">
    <div class="col-md-3">
        <div class="card border-0 shadow-sm text-center p-3">
            <div class="fs-2 fw-bold text-primary"><?= $stats['files'] ?></div>
            <div class="text-muted small">Cache Files</div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card border-0 shadow-sm text-center p-3">
            <div class="fs-2 fw-bold text-info"><?= $stats['size'] ?></div>
            <div class="text-muted small">Total Size</div>
        </div>
    </div>
</div>

<div class="card border-0 shadow-sm" style="max-width:500px">
    <div class="card-body">
        <h6 class="mb-3">Clear Cache</h6>
        <form method="POST" action="/admin/cache/clear" onsubmit="return confirm('Clear cache?')">
            <div class="mb-3">
                <select name="type" class="form-select">
                    <option value="all">All Cache</option>
                    <option value="editions">Editions Cache</option>
                    <option value="categories">Categories Cache</option>
                    <option value="settings">Settings Cache</option>
                </select>
            </div>
            <button type="submit" class="btn btn-warning">
                <i class="bi bi-lightning me-1"></i> Clear Cache
            </button>
        </form>
    </div>
</div>
