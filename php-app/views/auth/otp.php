<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Verify OTP | ePaper CMS</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <style>body { background: #f1f5f9; } .card { max-width: 420px; margin: 100px auto; }</style>
</head>
<body>
<div class="card shadow-sm p-4">
    <h4 class="mb-4">Enter OTP</h4>
    <?php require ROOT . '/views/partials/flash.php'; ?>
    <form method="POST" action="/verify-otp">
        <div class="mb-3">
            <label class="form-label">6-digit OTP Code</label>
            <input type="text" name="otp" class="form-control text-center fs-4 letter-spacing-2"
                   maxlength="6" pattern="\d{6}" required autofocus>
        </div>
        <button class="btn btn-primary w-100">Verify OTP</button>
    </form>
    <div class="text-center mt-3"><a href="/forgot-password" class="text-muted small">Resend OTP</a></div>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
