<div class="d-flex justify-content-between align-items-center mb-4">
    <h5 class="mb-0">Media Tags</h5>
    <a href="/admin/media" class="btn btn-outline-secondary btn-sm">← Media Library</a>
</div>

<div class="row g-4">
    <div class="col-md-4">
        <div class="card border-0 shadow-sm">
            <div class="card-body">
                <h6>Add Tag</h6>
                <form method="POST" action="/admin/media/tags">
                    <div class="input-group">
                        <input type="text" name="name" class="form-control" placeholder="Tag name" required>
                        <button class="btn btn-primary">Add</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <div class="col-md-8">
        <div class="card border-0 shadow-sm">
            <div class="card-body p-0">
                <table class="table mb-0">
                    <thead class="table-light">
                        <tr><th>Tag</th><th>Usage</th><th></th></tr>
                    </thead>
                    <tbody>
                        <?php foreach ($tags as $t): ?>
                        <tr>
                            <td><?= htmlspecialchars($t['name']) ?></td>
                            <td><?= $t['usage_count'] ?></td>
                            <td>
                                <form method="POST" action="/admin/media/tags/delete/<?= $t['id'] ?>"
                                      onsubmit="return confirm('Delete tag?')">
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
