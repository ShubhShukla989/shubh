<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Forgot Password | ePaper CMS</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <style>body { background: #f1f5f9; } .card { max-width: 420px; margin: 100px auto; }</style>
</head>
<body>
<div class="card shadow-sm p-4">
    <h4 class="mb-4">Forgot Password</h4>
    <?php require ROOT . '/views/partials/flash.php'; ?>
    <form method="POST" action="/forgot-password">
        <div class="mb-3">
            <label class="form-label">Email Address</label>
            <input type="email" name="email" class="form-control" required autofocus>
        </div>
        <button class="btn btn-primary w-100">Send OTP</button>
    </form>
    <div class="text-center mt-3"><a href="/login" class="text-muted small">Back to Login</a></div>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
