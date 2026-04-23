<?php
require_once ROOT . '/core/Controller.php';

class CategoryController extends Controller {

    public function index(array $params = []): void {
        requireAdmin();
        $categories = db()->query("SELECT * FROM categories ORDER BY sort_order ASC, name ASC")->fetchAll();
        $this->view('admin/categories/index', ['title' => 'Categories', 'categories' => $categories], 'admin');
    }

    public function create(array $params = []): void {
        requireAdmin();
        $this->view('admin/categories/form', ['title' => 'Create Category', 'category' => null], 'admin');
    }

    public function store(array $params = []): void {
        requireAdmin();
        $name      = trim($_POST['name'] ?? '');
        $alias     = trim($_POST['alias'] ?? '');
        $desc      = trim($_POST['description'] ?? '');
        $sort      = (int)($_POST['sort_order'] ?? 0);
        $is_active = isset($_POST['is_active']) ? 1 : 0;

        if (!$name || !$alias) {
            $this->flash('danger', 'Name and alias are required.');
            $this->redirect('/admin/categories/create');
        }

        // Auto-generate alias if empty
        if (!$alias) {
            $alias = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $name));
        }

        try {
            db()->prepare("INSERT INTO categories (name, alias, description, sort_order, is_active) VALUES (?,?,?,?,?)")
                ->execute([$name, $alias, $desc, $sort, $is_active]);
            $this->flash('success', 'Category created successfully.');
        } catch (PDOException $e) {
            $this->flash('danger', 'Alias already exists. Please use a unique alias.');
        }

        $this->redirect('/admin/categories');
    }

    public function edit(array $params = []): void {
        requireAdmin();
        $category = $this->findOrFail((int)$params['id']);
        $this->view('admin/categories/form', ['title' => 'Edit Category', 'category' => $category], 'admin');
    }

    public function update(array $params = []): void {
        requireAdmin();
        $id        = (int)$params['id'];
        $name      = trim($_POST['name'] ?? '');
        $alias     = trim($_POST['alias'] ?? '');
        $desc      = trim($_POST['description'] ?? '');
        $sort      = (int)($_POST['sort_order'] ?? 0);
        $is_active = isset($_POST['is_active']) ? 1 : 0;

        if (!$name || !$alias) {
            $this->flash('danger', 'Name and alias are required.');
            $this->redirect("/admin/categories/edit/$id");
        }

        try {
            db()->prepare("UPDATE categories SET name=?, alias=?, description=?, sort_order=?, is_active=? WHERE id=?")
                ->execute([$name, $alias, $desc, $sort, $is_active, $id]);
            $this->flash('success', 'Category updated.');
        } catch (PDOException $e) {
            $this->flash('danger', 'Alias already exists.');
        }

        $this->redirect('/admin/categories');
    }

    public function delete(array $params = []): void {
        requireAdmin();
        $id = (int)$params['id'];
        db()->prepare("DELETE FROM categories WHERE id = ?")->execute([$id]);
        $this->flash('success', 'Category deleted.');
        $this->redirect('/admin/categories');
    }

    private function findOrFail(int $id): array {
        $stmt = db()->prepare("SELECT * FROM categories WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) { http_response_code(404); require ROOT . '/views/errors/404.php'; exit; }
        return $row;
    }
}
