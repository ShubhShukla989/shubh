<?php
class Controller {

    /**
     * Render a view with an optional layout.
     * If layout is provided, the view output is captured into $content
     * and injected into the layout.
     */
    protected function view(string $view, array $data = [], string $layout = ''): void {
        extract($data);

        if ($layout) {
            ob_start();
            require ROOT . '/views/' . $view . '.php';
            $content = ob_get_clean();
            require ROOT . '/views/layouts/' . $layout . '.php';
        } else {
            require ROOT . '/views/' . $view . '.php';
        }
    }

    protected function json(mixed $data, int $status = 200): void {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    protected function redirect(string $url): void {
        header('Location: ' . $url);
        exit;
    }

    protected function flash(string $type, string $msg): void {
        $_SESSION['flash'] = ['type' => $type, 'msg' => $msg];
    }

    protected function input(string $key, mixed $default = ''): mixed {
        return $_POST[$key] ?? $_GET[$key] ?? $default;
    }

    protected function sanitize(string $value): string {
        return htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
    }
}
