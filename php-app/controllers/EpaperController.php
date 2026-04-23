<?php
require_once ROOT . '/core/Controller.php';

class EpaperController extends Controller {

    public function display(array $params = []): void {
        // Latest published edition per category
        $featured = db()->query(
            "SELECT e.*, c.name as category_name, c.alias as category_alias,
                    (SELECT image_path FROM edition_pages WHERE edition_id = e.id AND page_number = 1 LIMIT 1) as cover
             FROM featured_editions fe
             JOIN editions e ON e.id = fe.edition_id
             LEFT JOIN categories c ON c.id = e.category_id
             WHERE e.status = 'published'
             ORDER BY fe.sort_order ASC
             LIMIT 12"
        )->fetchAll();

        // If no featured, fall back to latest
        if (empty($featured)) {
            $featured = db()->query(
                "SELECT e.*, c.name as category_name, c.alias as category_alias,
                        (SELECT image_path FROM edition_pages WHERE edition_id = e.id AND page_number = 1 LIMIT 1) as cover
                 FROM editions e
                 LEFT JOIN categories c ON c.id = e.category_id
                 WHERE e.status = 'published'
                 ORDER BY e.publish_date DESC, e.created_at DESC
                 LIMIT 12"
            )->fetchAll();
        }

        $categories = db()->query(
            "SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, name ASC"
        )->fetchAll();

        $this->view('epaper/display', [
            'title'      => 'Latest Editions',
            'featured'   => $featured,
            'categories' => $categories,
        ], 'public');
    }

    public function archive(array $params = []): void {
        $categoryId = (int)($_GET['category'] ?? 0);
        $page       = max(1, (int)($_GET['page'] ?? 1));
        $perPage    = 20;
        $offset     = ($page - 1) * $perPage;

        $where = "WHERE e.status = 'published'";
        $bind  = [];
        if ($categoryId) {
            $where .= " AND e.category_id = ?";
            $bind[] = $categoryId;
        }

        $total = db()->prepare("SELECT COUNT(*) FROM editions e $where");
        $total->execute($bind);
        $total = (int)$total->fetchColumn();

        $stmt = db()->prepare(
            "SELECT e.*, c.name as category_name,
                    (SELECT image_path FROM edition_pages WHERE edition_id = e.id AND page_number = 1 LIMIT 1) as cover
             FROM editions e
             LEFT JOIN categories c ON c.id = e.category_id
             $where
             ORDER BY e.publish_date DESC, e.created_at DESC
             LIMIT $perPage OFFSET $offset"
        );
        $stmt->execute($bind);
        $editions = $stmt->fetchAll();

        $categories = db()->query("SELECT * FROM categories WHERE is_active=1 ORDER BY sort_order, name")->fetchAll();

        $this->view('epaper/archive', [
            'title'       => 'Archive',
            'editions'    => $editions,
            'categories'  => $categories,
            'categoryId'  => $categoryId,
            'page'        => $page,
            'totalPages'  => (int)ceil($total / $perPage),
        ], 'public');
    }

    public function view(array $params = []): void {
        $edition = $this->findEditionOrFail((int)$params['editionId']);

        $pages = db()->prepare(
            "SELECT * FROM edition_pages WHERE edition_id = ? ORDER BY page_number ASC"
        );
        $pages->execute([$edition['id']]);
        $pages = $pages->fetchAll();

        // Track analytics
        $this->trackVisit('/epaper/view/' . $edition['id']);

        $this->view('epaper/view', [
            'title'   => $edition['title'],
            'edition' => $edition,
            'pages'   => $pages,
        ], 'public');
    }

    public function category(array $params = []): void {
        $alias = $params['alias'] ?? '';
        $stmt  = db()->prepare("SELECT * FROM categories WHERE alias = ? AND is_active = 1");
        $stmt->execute([$alias]);
        $category = $stmt->fetch();

        if (!$category) {
            http_response_code(404);
            require ROOT . '/views/errors/404.php';
            return;
        }

        $page    = max(1, (int)($_GET['page'] ?? 1));
        $perPage = 16;
        $offset  = ($page - 1) * $perPage;

        $total = db()->prepare("SELECT COUNT(*) FROM editions WHERE category_id = ? AND status = 'published'");
        $total->execute([$category['id']]);
        $total = (int)$total->fetchColumn();

        $stmt = db()->prepare(
            "SELECT e.*,
                    (SELECT image_path FROM edition_pages WHERE edition_id = e.id AND page_number = 1 LIMIT 1) as cover
             FROM editions e
             WHERE e.category_id = ? AND e.status = 'published'
             ORDER BY e.publish_date DESC
             LIMIT $perPage OFFSET $offset"
        );
        $stmt->execute([$category['id']]);
        $editions = $stmt->fetchAll();

        $this->view('epaper/category', [
            'title'      => $category['name'],
            'category'   => $category,
            'editions'   => $editions,
            'page'       => $page,
            'totalPages' => (int)ceil($total / $perPage),
        ], 'public');
    }

    public function fullPage(array $params = []): void {
        $edition    = $this->findEditionOrFail((int)$params['editionId']);
        $pageNumber = max(1, (int)$params['pageNumber']);

        $stmt = db()->prepare(
            "SELECT * FROM edition_pages WHERE edition_id = ? AND page_number = ?"
        );
        $stmt->execute([$edition['id'], $pageNumber]);
        $page = $stmt->fetch();

        if (!$page) {
            http_response_code(404);
            require ROOT . '/views/errors/404.php';
            return;
        }

        $totalPages = db()->prepare("SELECT COUNT(*) FROM edition_pages WHERE edition_id = ?");
        $totalPages->execute([$edition['id']]);
        $totalPages = (int)$totalPages->fetchColumn();

        // Area maps for this page
        $areaMaps = db()->prepare(
            "SELECT * FROM area_maps WHERE edition_id = ? AND page_id = ?"
        );
        $areaMaps->execute([$edition['id'], $page['id']]);
        $areaMaps = $areaMaps->fetchAll();

        $this->view('epaper/full-page', [
            'title'      => $edition['title'] . ' — Page ' . $pageNumber,
            'edition'    => $edition,
            'page'       => $page,
            'pageNumber' => $pageNumber,
            'totalPages' => $totalPages,
            'areaMaps'   => $areaMaps,
        ], 'public');
    }

    public function areaMap(array $params = []): void {
        $stmt = db()->prepare(
            "SELECT am.*, e.title as edition_title
             FROM area_maps am
             JOIN editions e ON e.id = am.edition_id
             WHERE am.id = ?"
        );
        $stmt->execute([(int)$params['areaMapId']]);
        $areaMap = $stmt->fetch();

        if (!$areaMap) {
            http_response_code(404);
            require ROOT . '/views/errors/404.php';
            return;
        }

        $this->view('epaper/area-map', [
            'title'   => $areaMap['title'] ?? 'Area Map',
            'areaMap' => $areaMap,
        ], 'public');
    }

    public function clip(array $params = []): void {
        $stmt = db()->prepare(
            "SELECT c.*, am.title as area_map_title, e.title as edition_title
             FROM clips c
             LEFT JOIN area_maps am ON am.id = c.area_map_id
             LEFT JOIN editions e ON e.id = am.edition_id
             WHERE c.id = ?"
        );
        $stmt->execute([(int)$params['clipId']]);
        $clip = $stmt->fetch();

        if (!$clip) {
            http_response_code(404);
            require ROOT . '/views/errors/404.php';
            return;
        }

        $this->view('epaper/clip', [
            'title' => $clip['title'] ?? 'Clip',
            'clip'  => $clip,
        ], 'public');
    }

    public function mobile(array $params = []): void {
        $editions = db()->query(
            "SELECT e.*,
                    (SELECT image_path FROM edition_pages WHERE edition_id = e.id AND page_number = 1 LIMIT 1) as cover
             FROM editions e
             WHERE e.status = 'published'
             ORDER BY e.publish_date DESC
             LIMIT 20"
        )->fetchAll();

        $this->view('epaper/mobile', [
            'title'    => 'Mobile ePaper',
            'editions' => $editions,
        ], 'public');
    }

    public function mobileEdition(array $params = []): void {
        $edition = $this->findEditionOrFail((int)$params['editionId']);

        $pages = db()->prepare(
            "SELECT * FROM edition_pages WHERE edition_id = ? ORDER BY page_number ASC"
        );
        $pages->execute([$edition['id']]);
        $pages = $pages->fetchAll();

        $this->view('epaper/mobile-edition', [
            'title'   => $edition['title'],
            'edition' => $edition,
            'pages'   => $pages,
        ], 'public');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function findEditionOrFail(int $id): array {
        $stmt = db()->prepare(
            "SELECT e.*, c.name as category_name
             FROM editions e
             LEFT JOIN categories c ON c.id = e.category_id
             WHERE e.id = ? AND e.status = 'published'"
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) {
            http_response_code(404);
            require ROOT . '/views/errors/404.php';
            exit;
        }
        return $row;
    }

    private function trackVisit(string $page): void {
        try {
            db()->prepare("INSERT INTO analytics (page, ip, user_agent) VALUES (?,?,?)")
                ->execute([
                    $page,
                    $_SERVER['REMOTE_ADDR'] ?? '',
                    substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
                ]);
        } catch (Exception $e) {
            // Non-critical, silently fail
        }
    }
}
