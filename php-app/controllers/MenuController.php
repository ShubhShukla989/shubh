<?php
require_once ROOT . '/core/Controller.php';

class MenuController extends Controller {

    public function index(array $params = []): void {
        requireAdmin();
        $menus = db()->query("SELECT * FROM menus ORDER BY name")->fetchAll();
        $this->view('admin/menus/index', ['title' => 'Menus', 'menus' => $menus], 'admin');
    }

    public function store(array $params = []): void {
        requireAdmin();
        $name  = trim($_POST['name'] ?? '');
        $alias = trim($_POST['alias'] ?? '');
        if (!$name || !$alias) {
            $this->flash('danger', 'Name and alias required.');
            $this->redirect('/admin/menus');
        }
        try {
            db()->prepare("INSERT INTO menus (name, alias) VALUES (?,?)")->execute([$name, $alias]);
            $this->flash('success', 'Menu created.');
        } catch (PDOException $e) {
            $this->flash('danger', 'Alias already exists.');
        }
        $this->redirect('/admin/menus');
    }

    public function delete(array $params = []): void {
        requireAdmin();
        db()->prepare("DELETE FROM menus WHERE id = ?")->execute([(int)$params['id']]);
        $this->flash('success', 'Menu deleted.');
        $this->redirect('/admin/menus');
    }

    public function items(array $params = []): void {
        requireAdmin();
        $menuId = (int)$params['id'];
        $stmt   = db()->prepare("SELECT * FROM menus WHERE id = ?");
        $stmt->execute([$menuId]);
        $menu   = $stmt->fetch();
        if (!$menu) { http_response_code(404); require ROOT . '/views/errors/404.php'; exit; }

        $items = db()->prepare("SELECT * FROM menu_items WHERE menu_id = ? ORDER BY sort_order ASC");
        $items->execute([$menuId]);
        $items = $items->fetchAll();

        $this->view('admin/menus/items', ['title' => 'Menu: ' . $menu['name'], 'menu' => $menu, 'items' => $items], 'admin');
    }

    public function storeItem(array $params = []): void {
        requireAdmin();
        $menuId    = (int)$params['id'];
        $label     = trim($_POST['label'] ?? '');
        $url       = trim($_POST['url'] ?? '');
        $parent_id = (int)($_POST['parent_id'] ?? 0) ?: null;
        $sort      = (int)($_POST['sort_order'] ?? 0);

        if (!$label) {
            $this->flash('danger', 'Label is required.');
            $this->redirect("/admin/menus/$menuId/items");
        }

        db()->prepare("INSERT INTO menu_items (menu_id, parent_id, label, url, sort_order) VALUES (?,?,?,?,?)")
            ->execute([$menuId, $parent_id, $label, $url, $sort]);
        $this->flash('success', 'Item added.');
        $this->redirect("/admin/menus/$menuId/items");
    }

    public function deleteItem(array $params = []): void {
        requireAdmin();
        $menuId = (int)$params['id'];
        db()->prepare("DELETE FROM menu_items WHERE id = ? AND menu_id = ?")->execute([(int)$params['itemId'], $menuId]);
        $this->flash('success', 'Item deleted.');
        $this->redirect("/admin/menus/$menuId/items");
    }
}
