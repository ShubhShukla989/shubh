<?php
// ── Auth ─────────────────────────────────────────────────────────────────────
$router->get('/login',                                          ['AuthController', 'loginPage']);
$router->post('/login',                                         ['AuthController', 'login']);
$router->get('/logout',                                         ['AuthController', 'logout']);
$router->get('/forgot-password',                                ['AuthController', 'forgotPage']);
$router->post('/forgot-password',                               ['AuthController', 'forgot']);
$router->get('/verify-otp',                                     ['AuthController', 'otpPage']);
$router->post('/verify-otp',                                    ['AuthController', 'verifyOtp']);
$router->get('/reset-password',                                 ['AuthController', 'resetPage']);
$router->post('/reset-password',                                ['AuthController', 'reset']);

// ── Admin Dashboard ───────────────────────────────────────────────────────────
$router->get('/admin',                                          ['AdminController', 'dashboard']);

// ── Admin: Categories ─────────────────────────────────────────────────────────
$router->get('/admin/categories',                               ['CategoryController', 'index']);
$router->get('/admin/categories/create',                        ['CategoryController', 'create']);
$router->post('/admin/categories/create',                       ['CategoryController', 'store']);
$router->get('/admin/categories/edit/[id]',                     ['CategoryController', 'edit']);
$router->post('/admin/categories/edit/[id]',                    ['CategoryController', 'update']);
$router->post('/admin/categories/delete/[id]',                  ['CategoryController', 'delete']);

// ── Admin: Editions ───────────────────────────────────────────────────────────
$router->get('/admin/editions',                                 ['EditionController', 'index']);
$router->get('/admin/editions/create',                          ['EditionController', 'create']);
$router->post('/admin/editions/create',                         ['EditionController', 'store']);
$router->get('/admin/editions/[id]/edit',                       ['EditionController', 'edit']);
$router->post('/admin/editions/[id]/edit',                      ['EditionController', 'update']);
$router->get('/admin/editions/[id]/pages',                      ['EditionController', 'pages']);
$router->post('/admin/editions/[id]/extract',                   ['EditionController', 'extract']);
$router->post('/admin/editions/[id]/pages/[pageId]/delete',     ['EditionController', 'deletePage']);
$router->post('/admin/editions/delete/[id]',                    ['EditionController', 'delete']);

// ── Admin: Epaper Categories ──────────────────────────────────────────────────
$router->get('/admin/epaper/categories',                        ['EpaperCategoryController', 'index']);
$router->get('/admin/epaper/categories/create',                 ['EpaperCategoryController', 'create']);
$router->post('/admin/epaper/categories/create',                ['EpaperCategoryController', 'store']);
$router->get('/admin/epaper/categories/edit/[id]',              ['EpaperCategoryController', 'edit']);
$router->post('/admin/epaper/categories/edit/[id]',             ['EpaperCategoryController', 'update']);
$router->post('/admin/epaper/categories/delete/[id]',           ['EpaperCategoryController', 'delete']);

// ── Admin: Featured ───────────────────────────────────────────────────────────
$router->get('/admin/epaper/featured-editions',                 ['FeaturedController', 'editions']);
$router->post('/admin/epaper/featured-editions',                ['FeaturedController', 'editions']);
$router->get('/admin/epaper/featured-categories',               ['FeaturedController', 'categories']);
$router->post('/admin/epaper/featured-categories',              ['FeaturedController', 'categories']);

// ── Admin: Media ──────────────────────────────────────────────────────────────
$router->get('/admin/media',                                    ['MediaController', 'index']);
$router->post('/admin/media/upload',                            ['MediaController', 'upload']);
$router->post('/admin/media/delete/[id]',                       ['MediaController', 'delete']);
$router->get('/admin/media/tags',                               ['MediaController', 'tags']);
$router->post('/admin/media/tags',                              ['MediaController', 'tags']);
$router->post('/admin/media/tags/delete/[id]',                  ['MediaController', 'deleteTag']);

// ── Admin: Menus ──────────────────────────────────────────────────────────────
$router->get('/admin/menus',                                    ['MenuController', 'index']);
$router->post('/admin/menus/store',                             ['MenuController', 'store']);
$router->post('/admin/menus/delete/[id]',                       ['MenuController', 'delete']);
$router->get('/admin/menus/[id]/items',                         ['MenuController', 'items']);
$router->post('/admin/menus/[id]/items/store',                  ['MenuController', 'storeItem']);
$router->post('/admin/menus/[id]/items/[itemId]/delete',        ['MenuController', 'deleteItem']);

// ── Admin: Static Pages ───────────────────────────────────────────────────────
$router->get('/admin/pages',                                    ['AdminPageController', 'index']);
$router->get('/admin/pages/create',                             ['AdminPageController', 'create']);
$router->post('/admin/pages/create',                            ['AdminPageController', 'store']);
$router->get('/admin/pages/edit/[id]',                          ['AdminPageController', 'edit']);
$router->post('/admin/pages/edit/[id]',                         ['AdminPageController', 'update']);
$router->post('/admin/pages/delete/[id]',                       ['AdminPageController', 'delete']);

// ── Admin: Sliders ────────────────────────────────────────────────────────────
$router->get('/admin/sliders',                                  ['SliderController', 'index']);
$router->post('/admin/sliders/store',                           ['SliderController', 'store']);
$router->post('/admin/sliders/delete/[id]',                     ['SliderController', 'delete']);
$router->get('/admin/sliders/[id]/slides',                      ['SliderController', 'slides']);
$router->post('/admin/sliders/[id]/slides/store',               ['SliderController', 'storeSlide']);
$router->post('/admin/sliders/[id]/slides/[slideId]/delete',    ['SliderController', 'deleteSlide']);

// ── Admin: Users ──────────────────────────────────────────────────────────────
$router->get('/admin/users',                                    ['UserController', 'index']);
$router->post('/admin/users/store',                             ['UserController', 'store']);
$router->post('/admin/users/delete/[id]',                       ['UserController', 'delete']);
$router->get('/admin/users/permissions',                        ['UserController', 'permissions']);
$router->post('/admin/users/permissions',                       ['UserController', 'permissions']);

// ── Admin: Settings ───────────────────────────────────────────────────────────
$router->get('/admin/system/settings',                          ['SettingsController', 'index']);
$router->post('/admin/system/settings',                         ['SettingsController', 'update']);

// ── Admin: Cache ──────────────────────────────────────────────────────────────
$router->get('/admin/cache',                                    ['CacheController', 'index']);
$router->post('/admin/cache/clear',                             ['CacheController', 'clear']);

// ── Admin: Designer ───────────────────────────────────────────────────────────
$router->get('/admin/designer',                                 ['DesignerController', 'index']);
$router->get('/admin/designer/edit',                            ['DesignerController', 'edit']);
$router->post('/admin/designer/save',                           ['DesignerController', 'save']);

// ── Frontend ──────────────────────────────────────────────────────────────────
$router->get('/',                                               ['EpaperController', 'display']);
$router->get('/epaper/display',                                 ['EpaperController', 'display']);
$router->get('/epaper/archive',                                 ['EpaperController', 'archive']);
$router->get('/epaper/view/[editionId]',                        ['EpaperController', 'view']);
$router->get('/epaper/category/[alias]',                        ['EpaperController', 'category']);
$router->get('/epaper/full-page/[editionId]/[pageNumber]',      ['EpaperController', 'fullPage']);
$router->get('/epaper/area-map/[areaMapId]',                    ['EpaperController', 'areaMap']);
$router->get('/epaper/clip/[clipId]',                           ['EpaperController', 'clip']);
$router->get('/epaper/mobile',                                  ['EpaperController', 'mobile']);
$router->get('/epaper/mobile/[editionId]',                      ['EpaperController', 'mobileEdition']);
$router->get('/page/[alias]',                                   ['PageController', 'show']);
