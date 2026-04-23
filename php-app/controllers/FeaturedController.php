<?php
require_once ROOT . '/core/Controller.php';

class FeaturedController extends Controller {

    public function editions(array $params = []): void {
        requireAdmin();

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $action    = $_POST['action'] ?? '';
            $editionId = (int)($_POST['edition_id'] ?? 0);

            if ($action === 'add' && $editionId) {
                try {
                    db()->prepare("INSERT INTO featured_editions (edition_id, sort_order) VALUES (?,?)")
                        ->execute([$editionId, (int)($_POST['sort_order'] ?? 0)]);
                    $this->flash('success', 'Added to featured.');
                } catch (PDOException $e) { $this->flash('danger', 'Already featured.'); }
            } elseif ($action === 'remove' && $editionId) {
                db()->prepare("DELETE FROM featured_editions WHERE edition_id = ?")->execute([$editionId]);
                $this->flash('success', 'Removed from featured.');
            }
            $this->redirect('/admin/epaper/featured-editions');
        }

        $featured = db()->query(
            "SELECT fe.*, e.title FROM featured_editions fe
             JOIN editions e ON e.id = fe.edition_id
             ORDER BY fe.sort_order ASC"
        )->fetchAll();

        $all = db()->query("SELECT id, title FROM editions WHERE status='published' ORDER BY publish_date DESC")->fetchAll();

        $this->view('admin/epaper/featured-editions', [
            'title'    => 'Featured Editions',
            'featured' => $featured,
            'all'      => $all,
        ], 'admin');
    }

    public function categories(array $params = []): void {
        requireAdmin();

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $action     = $_POST['action'] ?? '';
            $categoryId = (int)($_POST['category_id'] ?? 0);

            if ($action === 'add' && $categoryId) {
                try {
                    db()->prepare("INSERT INTO featured_categories (category_id, sort_order) VALUES (?,?)")
                        ->execute([$categoryId, (int)($_POST['sort_order'] ?? 0)]);
                    $this->flash('success', 'Added to featured.');
                } catch (PDOException $e) { $this->flash('danger', 'Already featured.'); }
            } elseif ($action === 'remove' && $categoryId) {
                db()->prepare("DELETE FROM featured_categories WHERE category_id = ?")->execute([$categoryId]);
                $this->flash('success', 'Removed from featured.');
            }
            $this->redirect('/admin/epaper/featured-categories');
        }

        $featured = db()->query(
            "SELECT fc.*, c.name FROM featured_categories fc
             JOIN epaper_categories c ON c.id = fc.category_id
             ORDER BY fc.sort_order ASC"
        )->fetchAll();

        $all = db()->query("SELECT id, name FROM epaper_categories WHERE is_active=1 ORDER BY name")->fetchAll();

        $this->view('admin/epaper/featured-categories', [
            'title'    => 'Featured Categories',
            'featured' => $featured,
            'all'      => $all,
        ], 'admin');
    }
}
