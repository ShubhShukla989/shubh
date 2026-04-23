<?php
require_once ROOT . '/core/Controller.php';

class EpaperCategoryController extends Controller {

    public function index(array $params = []): void {
        requireAdmin();
        $cats = db()->query("SELECT * FROM epaper_categories ORDER BY sort_order, name")->fetchAll();
        $this->view('admin/epaper/categories/index', ['title' => 'Epaper Categories', 'categories' => $cats], 'admin');
    }

    public function create(array $params = []): void {
        requireAdmin();
        $this->view('admin/epaper/categories/form', ['title' => 'Create Epaper Category', 'category' => null], 'admin');
    }

    public function store(array $params = []): void {
        requireAdmin();
        $name  = trim($_POST['name'] ?? '');
        $alias = trim($_POST['alias'] ?? '');
        $sort  = (int)($_POST['sort_order'] ?? 0);
        $active = isset($_POST['is_active']) ? 1 : 0;

        if (!$name || !$alias) { $this->flash('danger', 'Name and alias required.'); $this->redirect('/admin/epaper/categories/create'); }

        try {
            db()->prepare("INSERT INTO epaper_categories (name, alias, sort_order, is_active) VALUES (?,?,?,?)")
                ->execute([$name, $alias, $sort, $active]);
            $this->flash('success', 'Category created.');
        } catch (PDOException $e) { $this->flash('danger', 'Alias exists.'); }
        $this->redirect('/admin/epaper/categories');
    }

    public function edit(array $params = []): void {
        requireAdmin();
        $cat = $this->findOrFail((int)$params['id']);
        $this->view('admin/epaper/categories/form', ['title' => 'Edit Epaper Category', 'category' => $cat], 'admin');
    }

    public function update(array $params = []): void {
        requireAdmin();
        $id    = (int)$params['id'];
        $name  = trim($_POST['name'] ?? '');
        $alias = trim($_POST['alias'] ?? '');
        $sort  = (int)($_POST['sort_order'] ?? 0);
        $active = isset($_POST['is_active']) ? 1 : 0;

        try {
            db()->prepare("UPDATE epaper_categories SET name=?, alias=?, sort_order=?, is_active=? WHERE id=?")
                ->execute([$name, $alias, $sort, $active, $id]);
            $this->flash('success', 'Category updated.');
        } catch (PDOException $e) { $this->flash('danger', 'Alias exists.'); }
        $this->redirect('/admin/epaper/categories');
    }

    public function delete(array $params = []): void {
        requireAdmin();
        db()->prepare("DELETE FROM epaper_categories WHERE id = ?")->execute([(int)$params['id']]);
        $this->flash('success', 'Category deleted.');
        $this->redirect('/admin/epaper/categories');
    }

    private function findOrFail(int $id): array {
        $stmt = db()->prepare("SELECT * FROM epaper_categories WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) { http_response_code(404); require ROOT . '/views/errors/404.php'; exit; }
        return $row;
    }
}
