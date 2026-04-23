<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <title><?= htmlspecialchars($edition['title']) ?></title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <style>
        body { background: #111; }
        .page-slide { scroll-snap-align: start; }
        .pages-container { scroll-snap-type: y mandatory; overflow-y: scroll; height: calc(100vh - 56px); }
    </style>
</head>
<body>
<div class="d-flex justify-content-between align-items-center px-3 py-2 bg-dark text-white" style="height:56px">
    <a href="/epaper/mobile" class="btn btn-sm btn-outline-light"><i class="bi bi-arrow-left"></i></a>
    <span class="fw-semibold text-truncate mx-2"><?= htmlspecialchars($edition['title']) ?></span>
    <span class="text-secondary small" id="pageIndicator">1 / <?= count($pages) ?></span>
</div>

<div class="pages-container" id="pagesContainer">
    <?php foreach ($pages as $i => $pg): ?>
    <div class="page-slide text-center" style="height:calc(100vh - 56px);display:flex;align-items:center;justify-content:center;">
        <img src="<?= htmlspecialchars($pg['image_path']) ?>"
             style="max-height:100%;max-width:100%;object-fit:contain;"
             alt="Page <?= $pg['page_number'] ?>"
             loading="<?= $i === 0 ? 'eager' : 'lazy' ?>">
    </div>
    <?php endforeach; ?>
</div>

<script>
const container = document.getElementById('pagesContainer');
const slides    = container.querySelectorAll('.page-slide');
const indicator = document.getElementById('pageIndicator');
const total     = slides.length;

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const idx = Array.from(slides).indexOf(entry.target);
            indicator.textContent = (idx + 1) + ' / ' + total;
        }
    });
}, { root: container, threshold: 0.5 });

slides.forEach(s => observer.observe(s));
</script>
</body>
</html>
