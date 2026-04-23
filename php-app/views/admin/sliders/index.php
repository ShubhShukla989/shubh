<div class="d-flex justify-content-between align-items-center mb-4">
    <h5 class="mb-0">Sliders</h5>
</div>
<div class="row g-4">
    <div class="col-md-4">
        <div class="card border-0 shadow-sm">
            <div class="card-body">
                <h6>Create Slider</h6>
                <form method="POST" action="/admin/sliders/store">
                    <div class="mb-2">
                        <input type="text" name="name" class="form-control" placeholder="Slider name" required
                               oninput="document.getElementById('salias').value=this.value.toLowerCase().replace(/[^a-z0-9]+/g,'-')">
                    </div>
                    <div class="mb-3">
                        <input type="text" name="alias" id="salias" class="form-control" placeholder="alias" required>
                    </div>
                    <button class="btn btn-primary w-100">Create</button>
                </form>
            </div>
        </div>
    </div>
    <div class="col-md-8">
        <div class="card border-0 shadow-sm">
            <div class="card-body p-0">
                <table class="table mb-0">
                    <thead class="table-light"><tr><th>Name</th><th>Alias</th><th>Slides</th><th>Actions</th></tr></thead>
                    <tbody>
                        <?php foreach ($sliders as $s): ?>
                        <tr>
                            <td><?= htmlspecialchars($s['name']) ?></td>
                            <td><code><?= htmlspecialchars($s['alias']) ?></code></td>
                            <td><?= $s['slide_count'] ?></td>
                            <td>
                                <a href="/admin/sliders/<?= $s['id'] ?>/slides" class="btn btn-sm btn-outline-primary">Slides</a>
                                <form method="POST" action="/admin/sliders/delete/<?= $s['id'] ?>" class="d-inline"
                                      onsubmit="return confirm('Delete slider?')">
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
