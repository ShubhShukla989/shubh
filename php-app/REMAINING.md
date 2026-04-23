# Remaining Work

## 1. Email (OTP / Forgot Password)
- `AuthController::forgot()` has a `// TODO: send email` comment
- Need to integrate PHPMailer or native `mail()` to actually send OTPs
- Config: SMTP host, port, user, pass in `config/mail.php`

## 2. File: `public/` folder + uploads directory
- Need to create `php-app/public/uploads/` with subfolders: `pdfs/`, `editions/`, `media/`, `sliders/`
- Add a `php-app/public/index.php` stub so direct folder access is blocked

## 3. Watermark System
- `area_maps` table has `watermark_path` column but no watermark generation logic
- Need `core/Watermark.php` — apply logo/text watermark on area map images using GD
- Admin UI: watermark settings (position, opacity, image) in system settings

## 4. Area Map Admin (missing entirely)
- No admin controller or views for creating/editing area maps on edition pages
- Need: `controllers/AreaMapController.php`
- Views: list, create, edit area maps per edition page
- Coordinate picker UI (click on page image to define crop region)

## 5. Clip Management Admin
- No admin UI for clips (saved article clips)
- Need: `controllers/ClipController.php`
- Views: list clips, view clip, delete clip

## 6. Analytics Dashboard
- `analytics` table exists and tracking works
- No admin UI to view analytics data
- Need: `controllers/AnalyticsController.php`
- Views: page views chart, top pages, visitor count by date range

## 7. robots.txt and ads.txt Routes
- Settings table stores `robots_txt` and `ads_txt` values
- Need dynamic routes: `GET /robots.txt` and `GET /ads.txt` that serve from DB

## 8. PDF Page Re-ordering
- Edition pages view shows pages but no drag-to-reorder
- Need sortable UI (drag & drop) + POST endpoint to update `page_number` order

## 9. Push Notifications
- Original app had `/api/push/subscribe` and `/api/push/unsubscribe`
- Not implemented — needs Web Push (web-push PHP library) or skip if not needed

## 10. Cache Layer
- `CacheController` clears files but nothing actually writes cache files yet
- Need `core/Cache.php` — simple file-based cache with get/set/invalidate
- Wire into `EpaperController` for editions and categories queries

## 11. Image Optimization
- Uploaded images are stored as-is
- Need resize/compress on upload in `MediaController` using GD

## 12. CSRF Protection
- Forms have no CSRF tokens — vulnerable to cross-site request forgery
- Need `core/CSRF.php` — generate token, validate on all POST routes

## 13. Input Sanitization for Page Content
- `pages.content` from TinyMCE is stored raw and rendered with `<?= $page['content'] ?>`
- Need HTML purifier (HTMLPurifier library or custom allowlist) before saving

## 14. 500 Error Page
- Only `404.php` exists in `views/errors/`
- Need `views/errors/500.php` and a global exception handler in `index.php`

## 15. Setup / Install Script
- No way to create the first admin user
- Need `php-app/setup.php` — one-time script to run schema + create superadmin account
- Should self-delete or lock after first run

## 16. `.env` Config File
- DB credentials are hardcoded in `config/database.php`
- Move to `php-app/.env` and load with a simple parser in `index.php`
