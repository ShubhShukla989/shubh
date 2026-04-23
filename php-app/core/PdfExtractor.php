<?php
/**
 * PdfExtractor — Pure PHP PDF page image extractor using Ghostscript.
 * Falls back to ImageMagick if GS not available.
 */
class PdfExtractor {

    private string $gsPath;
    private string $imPath;

    public function __construct() {
        // Try to detect tools from environment or common paths
        $this->gsPath = $this->detectTool([
            '/usr/bin/gs',
            '/usr/local/bin/gs',
            'gs',
            'C:/Program Files/gs/gs10.03.1/bin/gswin64c.exe',
        ]);
        $this->imPath = $this->detectTool([
            '/usr/bin/convert',
            '/usr/local/bin/convert',
            'convert',
            'C:/Program Files/ImageMagick-7.1.2-Q16-HDRI/magick.exe',
        ]);
    }

    private function detectTool(array $paths): string {
        foreach ($paths as $path) {
            if (file_exists($path)) return $path;
            // Check if available in PATH
            $out = shell_exec(PHP_OS_FAMILY === 'Windows' ? "where $path 2>nul" : "which $path 2>/dev/null");
            if ($out) return trim($out);
        }
        return '';
    }

    /**
     * Extract all pages from a PDF as JPEG images.
     * Returns array of saved image paths.
     */
    public function extractPages(string $pdfPath, string $outputDir, int $dpi = 150): array {
        if (!file_exists($pdfPath)) {
            throw new RuntimeException("PDF not found: $pdfPath");
        }

        if (!is_dir($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        $pageCount = $this->getPageCount($pdfPath);
        if ($pageCount === 0) {
            throw new RuntimeException("Could not determine page count.");
        }

        $pages = [];

        if ($this->gsPath) {
            $pages = $this->extractWithGhostscript($pdfPath, $outputDir, $dpi, $pageCount);
        } elseif ($this->imPath) {
            $pages = $this->extractWithImageMagick($pdfPath, $outputDir, $dpi, $pageCount);
        } else {
            throw new RuntimeException("No PDF extraction tool found. Install Ghostscript or ImageMagick.");
        }

        return $pages;
    }

    private function extractWithGhostscript(string $pdf, string $dir, int $dpi, int $count): array {
        $output  = $dir . '/page-%03d.jpg';
        $escaped = escapeshellarg($pdf);
        $outEsc  = escapeshellarg($output);
        $gsEsc   = escapeshellarg($this->gsPath);

        $cmd = "$gsEsc -dNOPAUSE -dBATCH -dSAFER -sDEVICE=jpeg -r{$dpi} -dJPEGQ=90 "
             . "-sOutputFile=$outEsc $escaped 2>&1";

        exec($cmd, $out, $code);

        if ($code !== 0) {
            throw new RuntimeException("Ghostscript failed: " . implode("\n", $out));
        }

        return $this->collectPages($dir, $count);
    }

    private function extractWithImageMagick(string $pdf, string $dir, int $dpi, int $count): array {
        $pages = [];
        for ($i = 0; $i < $count; $i++) {
            $outFile = $dir . '/page-' . str_pad($i + 1, 3, '0', STR_PAD_LEFT) . '.jpg';
            $cmd = escapeshellarg($this->imPath)
                 . " -density $dpi "
                 . escapeshellarg($pdf . "[$i]")
                 . " -quality 90 "
                 . escapeshellarg($outFile) . " 2>&1";
            exec($cmd, $out, $code);
            if (file_exists($outFile)) {
                $pages[] = $outFile;
            }
        }
        return $pages;
    }

    private function collectPages(string $dir, int $count): array {
        $pages = [];
        for ($i = 1; $i <= $count; $i++) {
            $file = $dir . '/page-' . str_pad($i, 3, '0', STR_PAD_LEFT) . '.jpg';
            if (file_exists($file)) {
                $pages[] = $file;
            }
        }
        return $pages;
    }

    public function getPageCount(string $pdfPath): int {
        // Try Ghostscript
        if ($this->gsPath) {
            $cmd = escapeshellarg($this->gsPath)
                 . " -dNODISPLAY -dNOPAUSE -dBATCH -dQUIET "
                 . "-c \"(" . addslashes($pdfPath) . ") (r) file runpdfbegin pdfpagecount = quit\" 2>&1";
            exec($cmd, $out);
            foreach ($out as $line) {
                if (is_numeric(trim($line))) return (int)trim($line);
            }
        }

        // Fallback: parse PDF binary for /Count
        $content = file_get_contents($pdfPath, false, null, 0, 65536);
        if (preg_match('/\/Count\s+(\d+)/', $content, $m)) {
            return (int)$m[1];
        }

        return 0;
    }

    /**
     * Generate a thumbnail from an existing image.
     */
    public function generateThumb(string $imagePath, string $thumbPath, int $width = 300): bool {
        if (!extension_loaded('gd')) return false;

        $src = imagecreatefromjpeg($imagePath);
        if (!$src) return false;

        $srcW = imagesx($src);
        $srcH = imagesy($src);
        $ratio = $width / $srcW;
        $height = (int)($srcH * $ratio);

        $thumb = imagecreatetruecolor($width, $height);
        imagecopyresampled($thumb, $src, 0, 0, 0, 0, $width, $height, $srcW, $srcH);
        imagejpeg($thumb, $thumbPath, 80);

        imagedestroy($src);
        imagedestroy($thumb);
        return true;
    }
}
