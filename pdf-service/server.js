const express = require('express');
const multer = require('multer');
const gm = require('gm');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { tmpdir } = require('os');

const app = express();
const upload = multer({ dest: '/tmp/uploads/' });

// Enable CORS for your Vercel domain
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*'
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'pdf-extraction' });
});

// PDF to PNG extraction endpoint
app.post('/extract-pdf', upload.single('pdf'), async (req, res) => {
  console.log('📄 PDF extraction request received');
  
  try {
    const { startPage = 1, endPage = 1, extractAll = true, resolution = 150 } = req.body;
    const pdfFile = req.file;

    if (!pdfFile) {
      return res.status(400).json({ success: false, error: 'No PDF file uploaded' });
    }

    console.log('Settings:', { startPage, endPage, extractAll, resolution });

    // Use ImageMagick
    const imageMagick = gm.subClass({ imageMagick: true });
    
    // Get total pages
    const totalPages = await new Promise((resolve, reject) => {
      imageMagick(pdfFile.path).identify('%p ', (err, value) => {
        if (err) reject(err);
        else resolve(value.trim().split(' ').length);
      });
    });

    console.log(`Total pages: ${totalPages}`);

    const pagesToExtract = extractAll 
      ? Array.from({ length: Math.min(totalPages, 30) }, (_, i) => i + 1)
      : Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

    const extractedPages = [];

    // Extract each page
    for (const pageNum of pagesToExtract) {
      console.log(`Processing page ${pageNum}...`);
      
      const outputPath = path.join(tmpdir(), `page-${Date.now()}-${pageNum}.png`);
      
      await new Promise((resolve, reject) => {
        imageMagick(`${pdfFile.path}[${pageNum - 1}]`)
          .density(resolution, resolution)
          .quality(90)
          .write(outputPath, (err) => {
            if (err) reject(err);
            else resolve();
          });
      });

      // Read the file as base64
      const imageBuffer = await fs.readFile(outputPath);
      const base64Image = imageBuffer.toString('base64');
      
      extractedPages.push({
        pageNumber: pageNum,
        imageData: `data:image/png;base64,${base64Image}`,
        size: imageBuffer.length
      });

      // Cleanup
      await fs.unlink(outputPath);
    }

    // Cleanup uploaded PDF
    await fs.unlink(pdfFile.path);

    console.log(`✅ Extracted ${extractedPages.length} pages`);

    res.json({
      success: true,
      totalPages,
      extractedPages: extractedPages.length,
      pages: extractedPages
    });

  } catch (error) {
    console.error('❌ Extraction error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`🚀 PDF Extraction Service running on port ${PORT}`);
});
