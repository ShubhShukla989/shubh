# PDF Extraction Microservice

A standalone service for converting PDF pages to high-quality PNG images using ImageMagick.

## Why This Service?

Vercel doesn't support binary dependencies like ImageMagick. This microservice runs on Railway/Render where ImageMagick is available.

## Features

- ✅ High-quality PDF to PNG conversion
- ✅ DPI control (150, 300, etc.)
- ✅ Batch extraction
- ✅ Base64 image output
- ✅ CORS enabled

## Deploy to Railway (FREE)

1. Push this folder to GitHub
2. Go to https://railway.app
3. Click "New Project" → "Deploy from GitHub"
4. Select the `pdf-service` folder
5. Railway will auto-detect Dockerfile and deploy
6. Copy the service URL (e.g., `https://your-service.railway.app`)

## Deploy to Render (FREE)

1. Go to https://render.com
2. Click "New" → "Web Service"
3. Connect your GitHub repo
4. Select `pdf-service` folder
5. Render will use Dockerfile automatically
6. Copy the service URL

## Environment Variables

```
PORT=3333
ALLOWED_ORIGIN=https://your-vercel-app.vercel.app
```

## API Usage

### Extract PDF Pages

**Endpoint:** `POST /extract-pdf`

**Request:**
```bash
curl -X POST https://your-service.railway.app/extract-pdf \
  -F "pdf=@document.pdf" \
  -F "resolution=150" \
  -F "extractAll=true"
```

**Response:**
```json
{
  "success": true,
  "totalPages": 10,
  "extractedPages": 10,
  "pages": [
    {
      "pageNumber": 1,
      "imageData": "data:image/png;base64,...",
      "size": 123456
    }
  ]
}
```

## Local Development

```bash
# Install dependencies
npm install

# Make sure ImageMagick is installed
brew install imagemagick  # macOS
apt-get install imagemagick  # Linux

# Start server
npm start
```

## Integration with Vercel

Update your Vercel API to call this service:

```typescript
// In your Vercel API route
const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL || 'https://your-service.railway.app';

const formData = new FormData();
formData.append('pdf', pdfFile);
formData.append('resolution', '150');
formData.append('extractAll', 'true');

const response = await fetch(`${PDF_SERVICE_URL}/extract-pdf`, {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

## Cost

- **Railway**: Free tier (500 hours/month)
- **Render**: Free tier (750 hours/month)

Both are more than enough for demo purposes!
