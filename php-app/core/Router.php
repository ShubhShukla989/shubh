<?php
class Router {
    private array $routes = [];

    public function get(string $path, array|callable $handler): void {
        $this->routes[] = ['GET', $path, $handler];
    }

    public function post(string $path, array|callable $handler): void {
        $this->routes[] = ['POST', $path, $handler];
    }

    public function dispatch(): void {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri    = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/') ?: '/';

        foreach ($this->routes as [$routeMethod, $routePath, $handler]) {
            $routePath = rtrim($routePath, '/') ?: '/';
            $pattern   = preg_replace('/\[(\w+)\]/', '(?P<$1>[^/]+)', $routePath);
            $pattern   = '#^' . $pattern . '$#';

            if ($method === $routeMethod && preg_match($pattern, $uri, $matches)) {
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);

                if (is_callable($handler)) {
                    call_user_func($handler, $params);
                    return;
                }

                [$controllerName, $action] = $handler;

                // Whitelist: only allow alphanumeric controller names
                if (!preg_match('/^[A-Za-z]+Controller$/', $controllerName)) {
                    http_response_code(400);
                    exit('Invalid controller.');
                }

                $file = ROOT . '/controllers/' . $controllerName . '.php';
                if (!file_exists($file)) {
                    http_response_code(404);
                    require ROOT . '/views/errors/404.php';
                    return;
                }

                require_once $file;
                $obj = new $controllerName();

                if (!method_exists($obj, $action)) {
                    http_response_code(404);
                    require ROOT . '/views/errors/404.php';
                    return;
                }

                $obj->$action($params);
                return;
            }
        }

        http_response_code(404);
        require ROOT . '/views/errors/404.php';
    }
}
