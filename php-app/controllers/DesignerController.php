<?php
require_once ROOT . '/core/Controller.php';

class DesignerController extends Controller {

    private string $layoutFile;

    public function __construct() {
        $this->layoutFile = ROOT . '/storage/layout.json';
    }

    public function index(array $params = []): void {
        requireAdmin();
        $layout = $this->loadLayout();
        $this->view('admin/designer/index', ['title' => 'Designer', 'layout' => $layout], 'admin');
    }

    public function edit(array $params = []): void {
        requireAdmin();
        $layout = $this->loadLayout();
        $this->view('admin/designer/edit', ['title' => 'Edit Layout', 'layout' => $layout], 'admin');
    }

    public function save(array $params = []): void {
        requireAdmin();
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) { $this->json(['error' => 'Invalid JSON'], 400); }

        $dir = dirname($this->layoutFile);
        if (!is_dir($dir)) mkdir($dir, 0755, true);

        file_put_contents($this->layoutFile, json_encode($data, JSON_PRETTY_PRINT));
        $this->json(['success' => true]);
    }

    private function loadLayout(): array {
        if (file_exists($this->layoutFile)) {
            return json_decode(file_get_contents($this->layoutFile), true) ?? [];
        }
        return [
            'header'  => ['show_logo' => true, 'show_nav' => true],
            'footer'  => ['show_links' => true],
            'sidebar' => ['enabled' => false],
            'colors'  => ['primary' => '#0d6efd', 'bg' => '#ffffff'],
        ];
    }
}
