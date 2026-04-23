<div class="row g-4">
    <div class="col-md-4">
        <div class="card border-0 shadow-sm">
            <div class="card-body">
                <h6>Add Featured Category</h6>
                <form method="POST" action="/admin/epaper/featured-categories">
                    <input type="hidden" name="action" value="add">
                    <div class="mb-2">
                        <select name="category_id" class="form-select" required>
                            <option value="">Select Category</option>
                            <?php foreach ($all as $c): ?>
                            <option value="<?= $c['id'] ?>"><?= htmlspecialchars($c['name']) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="mb-3">
                        <input type="number" name="sort_order" class="form-control" placeholder="Sort order" value="0">
                    </div>
                    <button class="btn btn-primary w-100">Add</button>
                </form>
            </div>
        </div>
    </div>
    <div class="col-md-8">
        <div class="card border-0 shadow-sm">
            <div class="card-body p-0">
                <table class="table mb-0">
                    <thead class="table-light"><tr><th>Category</th><th>Sort</th><th></th></tr></thead>
                    <tbody>
                        <?php foreach ($featured as $f): ?>
                        <tr>
                            <td><?= htmlspecialchars($f['name']) ?></td>
                            <td><?= $f['sort_order'] ?></td>
                            <td>
                                <form method="POST" action="/admin/epaper/featured-categories">
                                    <input type="hidden" name="action" value="remove">
                                    <input type="hidden" name="category_id" value="<?= $f['category_id'] ?>">
                                    <button class="btn btn-sm btn-outline-danger">Remove</button>
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
