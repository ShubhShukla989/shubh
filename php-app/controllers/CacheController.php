<?php
require_once ROOT . '/core/Controller.php';

class CacheController extends Controller {

    private string $cacheDir;

    public function __construct() {
        $this->cacheDir = ROOT . '/cache';
    }

    public function index(array $params = []): void {
        requireAdmin();
        $stats = $this->getStats();
        $this->view('admin/cache/index', ['title' => 'Cache Management', 'stats' => $stats], 'admin');
    }

    public function clear(array $params = []): void {
        requireAdmin();
        $type = $_POST['type'] ?? 'all';
        $cleared = $this->clearCache($type);
        $this->flash('success', "Cleared $cleared cache file(s).");
        $this->redirect('/admin/cache');
    }

    private function getStats(): array {
        if (!is_dir($this->cacheDir)) return ['files' => 0, 'size' => 0];
        $files = glob($this->cacheDir . '/*.cache') ?: [];
        $size  = array_sum(array_map('filesize', $files));
        return ['files' => count($files), 'size' => $this->formatBytes($size)];
    }

    private function clearCache(string $type): int {
        if (!is_dir($this->cacheDir)) return 0;
        $pattern = $type === 'all' ? '*.cache' : $type . '_*.cache';
        $files   = glob($this->cacheDir . '/' . $pattern) ?: [];
        foreach ($files as $f) unlink($f);
        return count($files);
    }

    private function formatBytes(int $bytes): string {
        if ($bytes < 1024) return $bytes . ' B';
        if ($bytes < 1048576) return round($bytes / 1024, 1) . ' KB';
        return round($bytes / 1048576, 1) . ' MB';
    }
}
