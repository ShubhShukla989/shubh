<?php
require_once ROOT . '/core/Controller.php';
require_once ROOT . '/core/PdfExtractor.php';

class EditionController extends Controller {

    public function index(array $params = []): void {
        requireAdmin();
        $editions = db()->query(
            "SELECT e.*, c.name as category_name
             FROM editions e
             LEFT JOIN categories c ON c.id = e.category_id
             ORDER BY e.created_at DESC"
        )->fetchAll();
        $this->view('admin/editions/index', ['title' => 'Editions', 'editions' => $editions], 'admin');
    }

    public function create(array $params = []): void {
        requireAdmin();
        $categories = db()->query("SELECT * FROM categories WHERE is_active=1 ORDER BY name")->fetchAll();
        $this->view('admin/editions/form', [
            'title'      => 'New Edition',
            'edition'    => null,
            'categories' => $categories,
        ], 'admin');
    }

    public function store(array $params = []): void {
        requireAdmin();

        $title       = trim($_POST['title'] ?? '');
        $category_id = (int)($_POST['category_id'] ?? 0) ?: null;
        $publish_date = $_POST['publish_date'] ?? null;
        $status      = $_POST['status'] ?? 'draft';

        if (!$title) {
            $this->flash('danger', 'Title is required.');
            $this->redirect('/admin/editions/create');
        }

        // Handle PDF upload
        $pdfPath = null;
        if (!empty($_FILES['pdf']['name'])) {
            $pdfPath = $this->uploadPdf($_FILES['pdf']);
            if (!$pdfPath) {
                $this->flash('danger', 'PDF upload failed. Only PDF files allowed.');
                $this->redirect('/admin/editions/create');
            }
        }

        $stmt = db()->prepare(
            "INSERT INTO editions (title, category_id, pdf_path, publish_date, status) VALUES (?,?,?,?,?)"
        );
        $stmt->execute([$title, $category_id, $pdfPath, $publish_date ?: null, $status]);
        $id = db()->lastInsertId();

        // Auto-extract pages if PDF uploaded
        if ($pdfPath) {
            $this->extractPages((int)$id, ROOT . '/public' . $pdfPath);
        }

        $this->flash('success', 'Edition created.');
        $this->redirect('/admin/editions');
    }

    public function edit(array $params = []): void {
        requireAdmin();
        $edition    = $this->findOrFail((int)$params['id']);
        $categories = db()->query("SELECT * FROM categories WHERE is_active=1 ORDER BY name")->fetchAll();
        $this->view('admin/editions/form', [
            'title'      => 'Edit Edition',
            'edition'    => $edition,
            'categories' => $categories,
        ], 'admin');
    }

    public function update(array $params = []): void {
        requireAdmin();
        $id          = (int)$params['id'];
        $title       = trim($_POST['title'] ?? '');
        $category_id = (int)($_POST['category_id'] ?? 0) ?: null;
        $publish_date = $_POST['publish_date'] ?? null;
        $status      = $_POST['status'] ?? 'draft';

        if (!$title) {
            $this->flash('danger', 'Title is required.');
            $this->redirect("/admin/editions/$id/edit");
        }

        $pdfPath = null;
        if (!empty($_FILES['pdf']['name'])) {
            $pdfPath = $this->uploadPdf($_FILES['pdf']);
        }

        if ($pdfPath) {
            db()->prepare(
                "UPDATE editions SET title=?, category_id=?, pdf_path=?, publish_date=?, status=? WHERE id=?"
            )->execute([$title, $category_id, $pdfPath, $publish_date ?: null, $status, $id]);
            $this->extractPages($id, ROOT . '/public' . $pdfPath);
        } else {
            db()->prepare(
                "UPDATE editions SET title=?, category_id=?, publish_date=?, status=? WHERE id=?"
            )->execute([$title, $category_id, $publish_date ?: null, $status, $id]);
        }

        $this->flash('success', 'Edition updated.');
        $this->redirect('/admin/editions');
    }

    public function pages(array $params = []): void {
        requireAdmin();
        $edition = $this->findOrFail((int)$params['id']);
        $pages   = db()->prepare(
            "SELECT * FROM edition_pages WHERE edition_id = ? ORDER BY page_number ASC"
        );
        $pages->execute([$edition['id']]);
        $pages = $pages->fetchAll();

        $this->view('admin/editions/pages', [
            'title'   => 'Edition Pages: ' . $edition['title'],
            'edition' => $edition,
            'pages'   => $pages,
        ], 'admin');
    }

    public function extract(array $params = []): void {
        requireAdmin();
        $edition = $this->findOrFail((int)$params['id']);

        if (!$edition['pdf_path']) {
            $this->flash('danger', 'No PDF uploaded for this edition.');
            $this->redirect("/admin/editions/{$edition['id']}/pages");
        }

        try {
            $count = $this->extractPages($edition['id'], ROOT . '/public' . $edition['pdf_path']);
            $this->flash('success', "Extracted $count pages successfully.");
        } catch (RuntimeException $e) {
            $this->flash('danger', 'Extraction failed: ' . $e->getMessage());
        }

        $this->redirect("/admin/editions/{$edition['id']}/pages");
    }

    public function deletePage(array $params = []): void {
        requireAdmin();
        $editionId = (int)$params['id'];
        $pageId    = (int)$params['pageId'];

        $page = db()->prepare("SELECT * FROM edition_pages WHERE id = ? AND edition_id = ?");
        $page->execute([$pageId, $editionId]);
        $page = $page->fetch();

        if ($page) {
            // Delete image files
            foreach (['image_path', 'thumb_path'] as $field) {
                if ($page[$field] && file_exists(ROOT . '/public' . $page[$field])) {
                    unlink(ROOT . '/public' . $page[$field]);
                }
            }
            db()->prepare("DELETE FROM edition_pages WHERE id = ?")->execute([$pageId]);
        }

        $this->flash('success', 'Page deleted.');
        $this->redirect("/admin/editions/$editionId/pages");
    }

    public function delete(array $params = []): void {
        requireAdmin();
        $id = (int)$params['id'];
        // Pages cascade via FK, but clean up files
        $pages = db()->prepare("SELECT * FROM edition_pages WHERE edition_id = ?");
        $pages->execute([$id]);
        foreach ($pages->fetchAll() as $page) {
            foreach (['image_path', 'thumb_path'] as $f) {
                if ($page[$f] && file_exists(ROOT . '/public' . $page[$f])) {
                    unlink(ROOT . '/public' . $page[$f]);
                }
            }
        }
        db()->prepare("DELETE FROM editions WHERE id = ?")->execute([$id]);
        $this->flash('success', 'Edition deleted.');
        $this->redirect('/admin/editions');
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function uploadPdf(array $file): ?string {
        if ($file['error'] !== UPLOAD_ERR_OK) return null;
        $mime = mime_content_type($file['tmp_name']);
        if ($mime !== 'application/pdf') return null;

        $dir = ROOT . '/public/uploads/pdfs';
        if (!is_dir($dir)) mkdir($dir, 0755, true);

        $filename = uniqid('pdf_', true) . '.pdf';
        $dest     = $dir . '/' . $filename;
        if (!move_uploaded_file($file['tmp_name'], $dest)) return null;

        return '/uploads/pdfs/' . $filename;
    }

    private function extractPages(int $editionId, string $pdfPath): int {
        $extractor = new PdfExtractor();
        $outputDir = ROOT . '/public/uploads/editions/' . $editionId . '/pages';
        $pages     = $extractor->extractPages($pdfPath, $outputDir);

        // Clear old pages
        db()->prepare("DELETE FROM edition_pages WHERE edition_id = ?")->execute([$editionId]);

        foreach ($pages as $i => $imagePath) {
            $relPath   = str_replace(ROOT . '/public', '', $imagePath);
            $thumbPath = str_replace('.jpg', '_thumb.jpg', $imagePath);
            $relThumb  = str_replace(ROOT . '/public', '', $thumbPath);

            $extractor->generateThumb($imagePath, $thumbPath, 300);

            db()->prepare(
                "INSERT INTO edition_pages (edition_id, page_number, image_path, thumb_path) VALUES (?,?,?,?)"
            )->execute([$editionId, $i + 1, $relPath, $relThumb]);
        }

        return count($pages);
    }

    private function findOrFail(int $id): array {
        $stmt = db()->prepare("SELECT * FROM editions WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) { http_response_code(404); require ROOT . '/views/errors/404.php'; exit; }
        return $row;
    }
}
