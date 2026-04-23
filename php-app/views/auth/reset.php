<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Reset Password | ePaper CMS</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <style>body { background: #f1f5f9; } .card { max-width: 420px; margin: 100px auto; }</style>
</head>
<body>
<div class="card shadow-sm p-4">
    <h4 class="mb-4">Reset Password</h4>
    <?php require ROOT . '/views/partials/flash.php'; ?>
    <form method="POST" action="/reset-password">
        <div class="mb-3">
            <label class="form-label">New Password</label>
            <input type="password" name="password" class="form-control" minlength="6" required autofocus>
            <div class="form-text">Minimum 6 characters.</div>
        </div>
        <button class="btn btn-primary w-100">Reset Password</button>
    </form>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
