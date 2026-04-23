<div class="mb-4">
    <a href="/admin/users" class="text-muted text-decoration-none"><i class="bi bi-arrow-left me-1"></i> Back to Users</a>
</div>

<div class="card border-0 shadow-sm">
    <div class="card-body">
        <form method="POST" action="/admin/users/permissions">
            <div class="table-responsive">
                <table class="table table-bordered align-middle" style="font-size:13px">
                    <thead class="table-dark">
                        <tr>
                            <th>Resource</th>
                            <?php foreach ($roles as $role): ?>
                            <th colspan="4" class="text-center"><?= ucfirst($role) ?></th>
                            <?php endforeach; ?>
                        </tr>
                        <tr>
                            <th></th>
                            <?php foreach ($roles as $role): ?>
                            <th class="text-center text-muted" style="font-size:11px">View</th>
                            <th class="text-center text-muted" style="font-size:11px">Create</th>
                            <th class="text-center text-muted" style="font-size:11px">Edit</th>
                            <th class="text-center text-muted" style="font-size:11px">Delete</th>
                            <?php endforeach; ?>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($resources as $resource): ?>
                        <tr>
                            <td class="fw-semibold"><?= ucfirst($resource) ?></td>
                            <?php foreach ($roles as $role): ?>
                            <?php $p = $permMap[$role][$resource] ?? []; ?>
                            <?php foreach (['view','create','edit','delete'] as $action): ?>
                            <td class="text-center">
                                <input type="checkbox" class="form-check-input"
                                       name="perm_<?= $role ?>_<?= $resource ?>_<?= $action ?>"
                                       <?= !empty($p["can_$action"]) ? 'checked' : '' ?>>
                            </td>
                            <?php endforeach; ?>
                            <?php endforeach; ?>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <button type="submit" class="btn btn-primary">Save Permissions</button>
        </form>
    </div>
</div>
