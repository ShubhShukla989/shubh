<?php
require_once ROOT . '/core/Controller.php';

class SliderController extends Controller {

    public function index(array $params = []): void {
        requireAdmin();
        $sliders = db()->query("SELECT s.*, COUNT(sl.id) as slide_count FROM sliders s LEFT JOIN slider_slides sl ON sl.slider_id = s.id GROUP BY s.id ORDER BY s.name")->fetchAll();
        $this->view('admin/sliders/index', ['title' => 'Sliders', 'sliders' => $sliders], 'admin');
    }

    public function store(array $params = []): void {
        requireAdmin();
        $name  = trim($_POST['name'] ?? '');
        $alias = trim($_POST['alias'] ?? '');
        if (!$name || !$alias) { $this->flash('danger', 'Name and alias required.'); $this->redirect('/admin/sliders'); }
        try {
            db()->prepare("INSERT INTO sliders (name, alias) VALUES (?,?)")->execute([$name, $alias]);
            $this->flash('success', 'Slider created.');
        } catch (PDOException $e) { $this->flash('danger', 'Alias exists.'); }
        $this->redirect('/admin/sliders');
    }

    public function delete(array $params = []): void {
        requireAdmin();
        db()->prepare("DELETE FROM sliders WHERE id = ?")->execute([(int)$params['id']]);
        $this->flash('success', 'Slider deleted.');
        $this->redirect('/admin/sliders');
    }

    public function slides(array $params = []): void {
        requireAdmin();
        $sliderId = (int)$params['id'];
        $stmt = db()->prepare("SELECT * FROM sliders WHERE id = ?");
        $stmt->execute([$sliderId]);
        $slider = $stmt->fetch();
        if (!$slider) { http_response_code(404); require ROOT . '/views/errors/404.php'; exit; }

        $slides = db()->prepare("SELECT * FROM slider_slides WHERE slider_id = ? ORDER BY sort_order ASC");
        $slides->execute([$sliderId]);
        $slides = $slides->fetchAll();

        $this->view('admin/sliders/slides', ['title' => 'Slides: ' . $slider['name'], 'slider' => $slider, 'slides' => $slides], 'admin');
    }

    public function storeSlide(array $params = []): void {
        requireAdmin();
        $sliderId = (int)$params['id'];
        $title    = trim($_POST['title'] ?? '');
        $url      = trim($_POST['url'] ?? '');
        $sort     = (int)($_POST['sort_order'] ?? 0);
        $imgPath  = null;

        if (!empty($_FILES['image']['name'])) {
            $file = $_FILES['image'];
            $mime = mime_content_type($file['tmp_name']);
            if (str_starts_with($mime, 'image/')) {
                $dir = ROOT . '/public/uploads/sliders';
                if (!is_dir($dir)) mkdir($dir, 0755, true);
                $filename = uniqid('slide_', true) . '.' . pathinfo($file['name'], PATHINFO_EXTENSION);
                if (move_uploaded_file($file['tmp_name'], $dir . '/' . $filename)) {
                    $imgPath = '/uploads/sliders/' . $filename;
                }
            }
        }

        db()->prepare("INSERT INTO slider_slides (slider_id, image_path, title, url, sort_order) VALUES (?,?,?,?,?)")
            ->execute([$sliderId, $imgPath, $title, $url, $sort]);
        $this->flash('success', 'Slide added.');
        $this->redirect("/admin/sliders/$sliderId/slides");
    }

    public function deleteSlide(array $params = []): void {
        requireAdmin();
        $sliderId = (int)$params['id'];
        $slideId  = (int)$params['slideId'];
        $stmt = db()->prepare("SELECT * FROM slider_slides WHERE id = ? AND slider_id = ?");
        $stmt->execute([$slideId, $sliderId]);
        $slide = $stmt->fetch();
        if ($slide && $slide['image_path'] && file_exists(ROOT . '/public' . $slide['image_path'])) {
            unlink(ROOT . '/public' . $slide['image_path']);
        }
        db()->prepare("DELETE FROM slider_slides WHERE id = ?")->execute([$slideId]);
        $this->flash('success', 'Slide deleted.');
        $this->redirect("/admin/sliders/$sliderId/slides");
    }
}
