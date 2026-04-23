<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Login | ePaper CMS</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <style>
        body { background: #f1f5f9; }
        .login-card { max-width: 420px; margin: 100px auto; }
    </style>
</head>
<body>
<div class="login-card card shadow-sm p-4">
    <h4 class="mb-4 text-center">ePaper CMS</h4>
    <?php require ROOT . '/views/partials/flash.php'; ?>
    <form method="POST" action="/login">
        <div class="mb-3">
            <label class="form-label">Email</label>
            <input type="email" name="email" class="form-control" required autofocus>
        </div>
        <div class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" name="password" class="form-control" required>
        </div>
        <button type="submit" class="btn btn-primary w-100">Login</button>
    </form>
    <div class="text-center mt-3">
        <a href="/forgot-password" class="text-muted small">Forgot password?</a>
    </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
