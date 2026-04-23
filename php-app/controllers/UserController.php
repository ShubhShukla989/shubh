<?php
require_once ROOT . '/core/Controller.php';

class UserController extends Controller {

    public function index(array $params = []): void {
        requireAdmin();
        $users = db()->query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC")->fetchAll();
        $this->view('admin/users/index', ['title' => 'Users', 'users' => $users], 'admin');
    }

    public function store(array $params = []): void {
        requireAdmin();
        $name     = trim($_POST['name'] ?? '');
        $email    = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        $role     = $_POST['role'] ?? 'viewer';

        if (!$name || !$email || strlen($password) < 6) {
            $this->flash('danger', 'All fields required. Password min 6 chars.');
            $this->redirect('/admin/users');
        }

        try {
            $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
            db()->prepare("INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)")
                ->execute([$name, $email, $hash, $role]);
            $this->flash('success', 'User created.');
        } catch (PDOException $e) {
            $this->flash('danger', 'Email already exists.');
        }
        $this->redirect('/admin/users');
    }

    public function delete(array $params = []): void {
        requireAdmin();
        $id = (int)$params['id'];
        if ($id === (int)(auth()['id'] ?? 0)) {
            $this->flash('danger', 'Cannot delete your own account.');
            $this->redirect('/admin/users');
        }
        db()->prepare("DELETE FROM users WHERE id = ?")->execute([$id]);
        $this->flash('success', 'User deleted.');
        $this->redirect('/admin/users');
    }

    public function permissions(array $params = []): void {
        requireAdmin();
        $roles       = ['admin', 'editor', 'viewer'];
        $resources   = ['editions', 'categories', 'media', 'pages', 'menus', 'sliders', 'users', 'settings'];
        $permissions = db()->query("SELECT * FROM permissions")->fetchAll();

        // Index by role+resource
        $permMap = [];
        foreach ($permissions as $p) {
            $permMap[$p['role']][$p['resource']] = $p;
        }

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            foreach ($roles as $role) {
                foreach ($resources as $resource) {
                    $can_view   = isset($_POST["perm_{$role}_{$resource}_view"])   ? 1 : 0;
                    $can_create = isset($_POST["perm_{$role}_{$resource}_create"]) ? 1 : 0;
                    $can_edit   = isset($_POST["perm_{$role}_{$resource}_edit"])   ? 1 : 0;
                    $can_delete = isset($_POST["perm_{$role}_{$resource}_delete"]) ? 1 : 0;

                    db()->prepare("INSERT INTO permissions (role, resource, can_view, can_create, can_edit, can_delete)
                                   VALUES (?,?,?,?,?,?)
                                   ON DUPLICATE KEY UPDATE can_view=?, can_create=?, can_edit=?, can_delete=?")
                        ->execute([$role, $resource, $can_view, $can_create, $can_edit, $can_delete,
                                   $can_view, $can_create, $can_edit, $can_delete]);
                }
            }
            $this->flash('success', 'Permissions saved.');
            $this->redirect('/admin/users/permissions');
        }

        $this->view('admin/users/permissions', [
            'title'       => 'Permissions',
            'roles'       => $roles,
            'resources'   => $resources,
            'permMap'     => $permMap,
        ], 'admin');
    }
}
