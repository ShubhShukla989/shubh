<?php
require_once ROOT . '/core/Controller.php';

class AuthController extends Controller {

    public function loginPage(): void {
        if (isLoggedIn()) { $this->redirect('/admin'); }
        $this->view('auth/login', ['title' => 'Login']);
    }

    public function login(): void {
        $email    = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';

        $stmt = db()->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            // Regenerate session ID on login to prevent session fixation
            session_regenerate_id(true);
            // Store only safe fields — never store password hash in session
            $_SESSION['user'] = [
                'id'    => $user['id'],
                'name'  => $user['name'],
                'email' => $user['email'],
                'role'  => $user['role'],
            ];
            $this->redirect('/admin');
        }

        $this->flash('danger', 'Invalid email or password.');
        $this->redirect('/login');
    }

    public function logout(): void {
        session_regenerate_id(true);
        session_unset();
        session_destroy();
        $this->redirect('/login');
    }

    public function forgotPage(): void {
        $this->view('auth/forgot', ['title' => 'Forgot Password']);
    }

    public function forgot(): void {
        $email = trim($_POST['email'] ?? '');
        $stmt  = db()->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user  = $stmt->fetch();

        if ($user) {
            $otp     = (string) random_int(100000, 999999); // cryptographically secure
            $expires = date('Y-m-d H:i:s', strtotime('+15 minutes'));
            db()->prepare("UPDATE users SET otp = ?, otp_expires = ? WHERE email = ?")
                ->execute([$otp, $expires, $email]);
            $_SESSION['otp_email'] = $email;
            // TODO: send $otp via email using PHPMailer or mail()
        }

        // Always show same message to prevent email enumeration
        $this->flash('success', 'If that email exists, an OTP has been sent.');
        $this->redirect('/verify-otp');
    }

    public function otpPage(): void {
        $this->view('auth/otp', ['title' => 'Verify OTP']);
    }

    public function verifyOtp(): void {
        $email = $_SESSION['otp_email'] ?? '';
        $otp   = trim($_POST['otp'] ?? '');

        if (!$email) {
            $this->redirect('/forgot-password');
        }

        $stmt = db()->prepare(
            "SELECT id FROM users WHERE email = ? AND otp = ? AND otp_expires > NOW()"
        );
        $stmt->execute([$email, $otp]);
        $user = $stmt->fetch();

        if ($user) {
            $_SESSION['reset_email'] = $email;
            $this->redirect('/reset-password');
        }

        $this->flash('danger', 'Invalid or expired OTP.');
        $this->redirect('/verify-otp');
    }

    public function resetPage(): void {
        if (empty($_SESSION['reset_email'])) {
            $this->redirect('/forgot-password');
        }
        $this->view('auth/reset', ['title' => 'Reset Password']);
    }

    public function reset(): void {
        $email    = $_SESSION['reset_email'] ?? '';
        $password = $_POST['password'] ?? '';

        if (!$email || strlen($password) < 6) {
            $this->flash('danger', 'Password must be at least 6 characters.');
            $this->redirect('/reset-password');
        }

        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        db()->prepare("UPDATE users SET password = ?, otp = NULL, otp_expires = NULL WHERE email = ?")
            ->execute([$hash, $email]);

        unset($_SESSION['reset_email'], $_SESSION['otp_email']);
        $this->flash('success', 'Password reset successfully. Please login.');
        $this->redirect('/login');
    }
}
