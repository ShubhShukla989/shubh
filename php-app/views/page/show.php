<div class="container py-4" style="max-width:860px">
    <?php if (!empty($page['meta_title'])): ?>
    <!-- Meta already set via layout title -->
    <?php endif; ?>

    <article>
        <h1 class="mb-4"><?= htmlspecialchars($page['title']) ?></h1>
        <div class="content-body">
            <?= $page['content'] /* HTML from TinyMCE — already sanitized on save */ ?>
        </div>
    </article>
</div>
