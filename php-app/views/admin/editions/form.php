<div class="mb-4">
    <a href="/admin/editions" class="text-muted text-decoration-none">
        <i class="bi bi-arrow-left me-1"></i> Back to Editions
    </a>
</div>

<div class="card border-0 shadow-sm" style="max-width:680px">
    <div class="card-body">
        <form method="POST"
              action="/admin/editions/<?= $edition ? $edition['id'] . '/edit' : 'create' ?>"
              enctype="multipart/form-data">

            <div class="mb-3">
                <label class="form-label">Title <span class="text-danger">*</span></label>
                <input type="text" name="title" class="form-control"
                       value="<?= htmlspecialchars($edition['title'] ?? '') ?>" required>
            </div>

            <div class="mb-3">
                <label class="form-label">Category</label>
                <select name="category_id" class="form-select">
                    <option value="">— None —</option>
                    <?php foreach ($categories as $cat): ?>
                    <option value="<?= $cat['id'] ?>"
                        <?= ($edition['category_id'] ?? '') == $cat['id'] ? 'selected' : '' ?>>
                        <?= htmlspecialchars($cat['name']) ?>
                    </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="mb-3">
                <label class="form-label">Publish Date</label>
                <input type="date" name="publish_date" class="form-control" style="width:200px"
                       value="<?= $edition['publish_date'] ?? '' ?>">
            </div>

            <div class="mb-3">
                <label class="form-label">Status</label>
                <select name="status" class="form-select" style="width:200px">
                    <?php foreach (['draft','published','archived'] as $s): ?>
                    <option value="<?= $s ?>" <?= ($edition['status'] ?? 'draft') === $s ? 'selected' : '' ?>>
                        <?= ucfirst($s) ?>
                    </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="mb-4">
                <label class="form-label">PDF File <?= $edition ? '(leave blank to keep existing)' : '' ?></label>
                <?php if (!empty($edition['pdf_path'])): ?>
                    <div class="mb-2">
                        <a href="<?= htmlspecialchars($edition['pdf_path']) ?>" target="_blank" class="text-success">
                            <i class="bi bi-file-pdf me-1"></i>Current PDF
                        </a>
                    </div>
                <?php endif; ?>
                <input type="file" name="pdf" class="form-control" accept=".pdf,application/pdf">
                <div class="form-text">Uploading a new PDF will automatically extract all pages as images.</div>
            </div>

            <button type="submit" class="btn btn-primary">
                <?= $edition ? 'Update Edition' : 'Create Edition' ?>
            </button>
        </form>
    </div>
</div>
