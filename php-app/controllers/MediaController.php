<?php
require_once ROOT . '/core/Controller.php';

class MediaController extends Controller {

    public function index(array $params = []): void {
        requireAdmin();
        $tag    = trim($_GET['tag'] ?? '');
        $search = trim($_GET['q'] ?? '');

        $sql  = "SELECT m.*, GROUP_CONCAT(t.name SEPARATOR ', ') as tags
                 FROM media m
                 LEFT JOIN media_tag_map mt ON mt.media_id = m.id
                 LEFT JOIN media_tags t ON t.id = mt.tag_id";
        $where = []; $bind = [];

        if ($search) { $where[] = "m.filename LIKE ?"; $bind[] = "%$search%"; }
        if ($tag)    { $where[] = "t.name = ?";        $bind[] = $tag; }

        if ($where) $sql .= " WHERE " . implode(' AND ', $where);
        $sql .= " GROUP BY m.id ORDER BY m.created_at DESC";

        $stmt = db()->prepare($sql);
        $stmt->execute($bind);
        $media = $stmt->fetchAll();

        $tags = db()->query("SELECT * FROM media_tags ORDER BY name")->fetchAll();

        $this->view('admin/media/index', [
            'title'  => 'Media Library',
            'media'  => $media,
            'tags'   => $tags,
            'search' => $search,
            'tag'    => $tag,
        ], 'admin');
    }

    public function upload(array $params = []): void {
        requireAdmin();
        if (empty($_FILES['file']['name'])) {
            $this->json(['error' => 'No file'], 400);
        }

        $file     = $_FILES['file'];
        $allowed  = ['image/jpeg','image/png','image/gif','image/webp','application/pdf'];
        $mime     = mime_content_type($file['tmp_name']);

        if (!in_array($mime, $allowed)) {
            $this->json(['error' => 'File type not allowed'], 400);
        }

        $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid('media_', true) . '.' . strtolower($ext);
        $dir      = ROOT . '/public/uploads/media';
        if (!is_dir($dir)) mkdir($dir, 0755, true);

        if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $filename)) {
            $this->json(['error' => 'Upload failed'], 500);
        }

        $path = '/uploads/media/' . $filename;
        db()->prepare("INSERT INTO media (filename, path, mime_type, size) VALUES (?,?,?,?)")
            ->execute([$file['name'], $path, $mime, $file['size']]);

        $id = db()->lastInsertId();
        $this->json(['id' => $id, 'path' => $path, 'filename' => $file['name']]);
    }

    public function delete(array $params = []): void {
        requireAdmin();
        $id   = (int)$params['id'];
        $stmt = db()->prepare("SELECT * FROM media WHERE id = ?");
        $stmt->execute([$id]);
        $media = $stmt->fetch();

        if ($media) {
            $full = ROOT . '/public' . $media['path'];
            if (file_exists($full)) unlink($full);
            db()->prepare("DELETE FROM media WHERE id = ?")->execute([$id]);
        }

        $this->flash('success', 'File deleted.');
        $this->redirect('/admin/media');
    }

    public function tags(array $params = []): void {
        requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $name = trim($_POST['name'] ?? '');
            if ($name) {
                try {
                    db()->prepare("INSERT INTO media_tags (name) VALUES (?)")->execute([$name]);
                    $this->flash('success', 'Tag added.');
                } catch (PDOException $e) {
                    $this->flash('danger', 'Tag already exists.');
                }
            }
            $this->redirect('/admin/media/tags');
        }

        $tags = db()->query("SELECT t.*, COUNT(mt.media_id) as usage_count
                             FROM media_tags t
                             LEFT JOIN media_tag_map mt ON mt.tag_id = t.id
                             GROUP BY t.id ORDER BY t.name")->fetchAll();
        $this->view('admin/media/tags', ['title' => 'Media Tags', 'tags' => $tags], 'admin');
    }

    public function deleteTag(array $params = []): void {
        requireAdmin();
        db()->prepare("DELETE FROM media_tags WHERE id = ?")->execute([(int)$params['id']]);
        $this->flash('success', 'Tag deleted.');
        $this->redirect('/admin/media/tags');
    }
}
