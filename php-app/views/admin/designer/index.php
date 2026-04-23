<div class="d-flex justify-content-between align-items-center mb-4">
    <h5 class="mb-0">Layout Designer</h5>
    <a href="/admin/designer/edit" class="btn btn-primary btn-sm"><i class="bi bi-pencil me-1"></i> Edit Layout</a>
</div>

<div class="row g-4">
    <div class="col-md-6">
        <div class="card border-0 shadow-sm">
            <div class="card-body">
                <h6>Current Layout Settings</h6>
                <table class="table table-sm">
                    <tbody>
                        <tr><td>Show Logo</td><td><?= $layout['header']['show_logo'] ? '✅' : '❌' ?></td></tr>
                        <tr><td>Show Navigation</td><td><?= $layout['header']['show_nav'] ? '✅' : '❌' ?></td></tr>
                        <tr><td>Show Footer Links</td><td><?= $layout['footer']['show_links'] ? '✅' : '❌' ?></td></tr>
                        <tr><td>Sidebar</td><td><?= $layout['sidebar']['enabled'] ? '✅ Enabled' : '❌ Disabled' ?></td></tr>
                        <tr>
                            <td>Primary Color</td>
                            <td>
                                <span class="d-inline-block rounded me-2"
                                      style="width:16px;height:16px;background:<?= htmlspecialchars($layout['colors']['primary'] ?? '#0d6efd') ?>"></span>
                                <?= htmlspecialchars($layout['colors']['primary'] ?? '#0d6efd') ?>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
