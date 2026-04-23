<?php
require_once ROOT . '/core/Controller.php';

class PageController extends Controller {

    public function show(array $params = []): void {
        $alias = $params['alias'] ?? '';
        $stmt  = db()->prepare("SELECT * FROM pages WHERE alias = ? AND is_active = 1");
        $stmt->execute([$alias]);
        $page  = $stmt->fetch();

        if (!$page) {
            http_response_code(404);
            require ROOT . '/views/errors/404.php';
            return;
        }

        $this->view('page/show', [
            'title'   => $page['title'],
            'page'    => $page,
        ], 'public');
    }
}
