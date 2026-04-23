<?php
define('ROOT', __DIR__);
require_once ROOT . '/config/database.php';
require_once ROOT . '/config/session.php';
require_once ROOT . '/core/Router.php';

$router = new Router();
require_once ROOT . '/routes/web.php';
$router->dispatch();
