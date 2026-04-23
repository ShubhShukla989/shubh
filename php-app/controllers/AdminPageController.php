<?php
require_once ROOT . '/core/Controller.php';

class AdminPageController extends Controller {

    public function index(array $params = []): void {
        requireAdmin();
        $pages = db()->query("SELECT * FROM pages ORDER BY title ASC")->fetchAll();
        $this->view('admin/pages/index', ['title' => 'Static Pages', 'pages' => $pages], 'admin');
    }

    public function create(array $params = []): void {
        requireAdmin();
        $this->view('admin/pages/form', ['title' => 'Create Page', 'page' => null], 'admin');
    }

    public function store(array $params = []): void {
        requireAdmin();
        $title     = trim($_POST['title'] ?? '');
        $alias     = trim($_POST['alias'] ?? '');
        $content   = $_POST['content'] ?? '';
        $meta_title = trim($_POST['meta_title'] ?? '');
        $meta_desc  = trim($_POST['meta_desc'] ?? '');
        $is_active  = isset($_POST['is_active']) ? 1 : 0;

        if (!$title || !$alias) {
            $this->flash('danger', 'Title and alias are required.');
            $this->redirect('/admin/pages/create');
        }

        try {
            db()->prepare("INSERT INTO pages (title, alias, content, meta_title, meta_desc, is_active) VALUES (?,?,?,?,?,?)")
                ->execute([$title, $alias, $content, $meta_title, $meta_desc, $is_active]);
            $this->flash('success', 'Page created.');
        } catch (PDOException $e) {
            $this->flash('danger', 'Alias already exists.');
        }
        $this->redirect('/admin/pages');
    }

    public function edit(array $params = []): void {
        requireAdmin();
        $page = $this->findOrFail((int)$params['id']);
        $this->view('admin/pages/form', ['title' => 'Edit Page', 'page' => $page], 'admin');
    }

    public function update(array $params = []): void {
        requireAdmin();
        $id        = (int)$params['id'];
        $title     = trim($_POST['title'] ?? '');
        $alias     = trim($_POST['alias'] ?? '');
        $content   = $_POST['content'] ?? '';
        $meta_title = trim($_POST['meta_title'] ?? '');
        $meta_desc  = trim($_POST['meta_desc'] ?? '');
        $is_active  = isset($_POST['is_active']) ? 1 : 0;

        try {
            db()->prepare("UPDATE pages SET title=?, alias=?, content=?, meta_title=?, meta_desc=?, is_active=? WHERE id=?")
                ->execute([$title, $alias, $content, $meta_title, $meta_desc, $is_active, $id]);
            $this->flash('success', 'Page updated.');
        } catch (PDOException $e) {
            $this->flash('danger', 'Alias already exists.');
        }
        $this->redirect('/admin/pages');
    }

    public function delete(array $params = []): void {
        requireAdmin();
        db()->prepare("DELETE FROM pages WHERE id = ?")->execute([(int)$params['id']]);
        $this->flash('success', 'Page deleted.');
        $this->redirect('/admin/pages');
    }

    private function findOrFail(int $id): array {
        $stmt = db()->prepare("SELECT * FROM pages WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) { http_response_code(404); require ROOT . '/views/errors/404.php'; exit; }
        return $row;
    }
}
