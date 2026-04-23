<?php
require_once ROOT . '/core/Controller.php';

class AdminController extends Controller {

    public function dashboard(array $params = []): void {
        requireAdmin();

        $stats = [
            'editions'   => db()->query("SELECT COUNT(*) FROM editions")->fetchColumn(),
            'categories' => db()->query("SELECT COUNT(*) FROM categories")->fetchColumn(),
            'media'      => db()->query("SELECT COUNT(*) FROM media")->fetchColumn(),
            'users'      => db()->query("SELECT COUNT(*) FROM users")->fetchColumn(),
        ];

        $recent = db()->query(
            "SELECT * FROM editions ORDER BY created_at DESC LIMIT 5"
        )->fetchAll();

        $this->view('admin/dashboard', [
            'title'  => 'Dashboard',
            'stats'  => $stats,
            'recent' => $recent,
        ], 'admin');
    }
}
