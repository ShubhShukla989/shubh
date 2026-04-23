<?php
require_once ROOT . '/core/Controller.php';

class SettingsController extends Controller {

    private array $settingKeys = [
        'site_name', 'site_description', 'site_url',
        'og_image', 'homepage', 'ads_txt',
        'analytics_id', 'robots_txt',
        'epaper_watermark', 'category_watermark',
    ];

    public function index(array $params = []): void {
        requireAdmin();
        $rows = db()->query("SELECT key_name, value FROM settings")->fetchAll();
        $settings = [];
        foreach ($rows as $row) {
            $settings[$row['key_name']] = $row['value'];
        }
        $this->view('admin/settings/index', ['title' => 'System Settings', 'settings' => $settings], 'admin');
    }

    public function update(array $params = []): void {
        requireAdmin();
        foreach ($this->settingKeys as $key) {
            $value = $_POST[$key] ?? '';
            db()->prepare("INSERT INTO settings (key_name, value) VALUES (?,?)
                           ON DUPLICATE KEY UPDATE value = ?")
                ->execute([$key, $value, $value]);
        }
        $this->flash('success', 'Settings saved.');
        $this->redirect('/admin/system/settings');
    }
}
