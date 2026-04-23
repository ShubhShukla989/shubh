<div class="d-flex justify-content-between align-items-center mb-4">
    <h5 class="mb-0">Media Library</h5>
    <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#uploadModal">
        <i class="bi bi-upload me-1"></i> Upload
    </button>
</div>

<form class="d-flex gap-2 mb-4" method="GET">
    <input type="text" name="q" class="form-control" placeholder="Search filename..." value="<?= htmlspecialchars($search) ?>" style="max-width:250px">
    <select name="tag" class="form-select" style="max-width:180px">
        <option value="">All Tags</option>
        <?php foreach ($tags as $t): ?>
        <option value="<?= htmlspecialchars($t['name']) ?>" <?= $tag === $t['name'] ? 'selected' : '' ?>>
            <?= htmlspecialchars($t['name']) ?>
        </option>
        <?php endforeach; ?>
    </select>
    <button class="btn btn-outline-secondary">Filter</button>
    <?php if ($search || $tag): ?>
    <a href="/admin/media" class="btn btn-outline-danger">Clear</a>
    <?php endif; ?>
</form>

<div class="row g-3">
    <?php foreach ($media as $file): ?>
    <div class="col-6 col-md-3 col-lg-2">
        <div class="card border-0 shadow-sm h-100">
            <?php if (str_starts_with($file['mime_type'], 'image/')): ?>
                <img src="<?= htmlspecialchars($file['path']) ?>" class="card-img-top"
                     style="height:120px;object-fit:cover;" alt="">
            <?php else: ?>
                <div class="d-flex align-items-center justify-content-center bg-light" style="height:120px">
                    <i class="bi bi-file-pdf text-danger fs-1"></i>
                </div>
            <?php endif; ?>
            <div class="card-body p-2">
                <p class="small text-truncate mb-1" title="<?= htmlspecialchars($file['filename']) ?>">
                    <?= htmlspecialchars($file['filename']) ?>
                </p>
                <?php if ($file['tags']): ?>
                <p class="text-muted" style="font-size:11px"><?= htmlspecialchars($file['tags']) ?></p>
                <?php endif; ?>
                <div class="d-flex gap-1">
                    <a href="<?= htmlspecialchars($file['path']) ?>" target="_blank"
                       class="btn btn-sm btn-outline-secondary flex-fill">View</a>
                    <form method="POST" action="/admin/media/delete/<?= $file['id'] ?>"
                          onsubmit="return confirm('Delete this file?')">
                        <button class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i></button>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <?php endforeach; ?>
    <?php if (empty($media)): ?>
    <div class="col-12 text-center text-muted py-5">No media files found.</div>
    <?php endif; ?>
</div>

<!-- Upload Modal -->
<div class="modal fade" id="uploadModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Upload File</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div id="uploadResult"></div>
                <input type="file" id="uploadFile" class="form-control mb-3" multiple
                       accept="image/*,application/pdf">
                <button class="btn btn-primary" onclick="doUpload()">Upload</button>
            </div>
        </div>
    </div>
</div>

<script>
async function doUpload() {
    const files = document.getElementById('uploadFile').files;
    const result = document.getElementById('uploadResult');
    if (!files.length) return;

    result.innerHTML = '<div class="alert alert-info">Uploading...</div>';
    let success = 0;

    for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/admin/media/upload', { method: 'POST', body: fd });
        if (res.ok) success++;
    }

    result.innerHTML = `<div class="alert alert-success">${success} file(s) uploaded.</div>`;
    setTimeout(() => location.reload(), 1000);
}
</script>
