const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const { layouts } = require('../lib/schema/layouts.ts');

// Create database connection
const sqlite = new Database('./database/epapercms.db');
const db = drizzle(sqlite);

// Default epaper layout structure
const epaperLayoutStructure = {
  rows: [
    {
      id: 'row-1',
      properties: {
        cssClass: 'epaper-header-row',
        customCss: 'padding: 10px; background: #f8f9fa;'
      },
      columns: [
        {
          id: 'col-1-1',
          width: 12,
          properties: {
            cssClass: 'text-center'
          },
          widgets: [
            {
              id: 'widget-1',
              type: 'heading',
              config: {
                title: 'Digital Epaper',
                renderTag: 'h1',
                format: 'h2',
                cssClasses: 'text-center mb-4'
              }
            }
          ]
        }
      ]
    },
    {
      id: 'row-2',
      properties: {
        cssClass: 'epaper-main-row'
      },
      columns: [
        {
          id: 'col-2-1',
          width: 8,
          properties: {
            cssClass: 'epaper-display-column'
          },
          widgets: [
            {
              id: 'widget-2',
              type: 'epaper-page-display',
              config: {
                title: 'Main Epaper Display',
                enableNavigation: true,
                enableZoom: true,
                defaultZoom: 1,
                cssClasses: 'epaper-main-display'
              },
              deviceVisibility: 'both'
            }
          ]
        },
        {
          id: 'col-2-2',
          width: 4,
          properties: {
            cssClass: 'epaper-controls-column'
          },
          widgets: [
            {
              id: 'widget-3',
              type: 'epaper-pagination',
              config: {
                title: 'Page Navigation',
                showPageNumbers: true,
                cssClasses: 'mb-4'
              },
              deviceVisibility: 'both'
            },
            {
              id: 'widget-4',
              type: 'epaper-zoom',
              config: {
                title: 'Zoom Controls',
                cssClasses: 'mb-4'
              },
              deviceVisibility: 'both'
            },
            {
              id: 'widget-5',
              type: 'epaper-pdf-download',
              config: {
                title: 'Download PDF',
                cssClasses: 'mb-4'
              },
              deviceVisibility: 'both'
            },
            {
              id: 'widget-6',
              type: 'epaper-clip-share',
              config: {
                title: 'Clip & Share',
                cssClasses: 'mb-4'
              },
              deviceVisibility: 'both'
            }
          ]
        }
      ]
    },
    {
      id: 'row-3',
      properties: {
        cssClass: 'epaper-footer-row',
        customCss: 'padding: 20px; background: #f8f9fa; margin-top: 20px;'
      },
      columns: [
        {
          id: 'col-3-1',
          width: 6,
          widgets: [
            {
              id: 'widget-7',
              type: 'epaper-thumb-navigation',
              config: {
                title: 'Thumbnail Navigation',
                cssClasses: 'thumbnail-nav'
              },
              deviceVisibility: 'desktop-only'
            }
          ]
        },
        {
          id: 'col-3-2',
          width: 6,
          widgets: [
            {
              id: 'widget-8',
              type: 'epaper-archive',
              config: {
                title: 'Archive',
                cssClasses: 'archive-widget'
              },
              deviceVisibility: 'both'
            }
          ]
        }
      ]
    }
  ]
};

async function createEpaperLayout() {
  try {
    console.log('Creating Epaper Display Layout...');
    
    // Insert the layout
    const result = await db.insert(layouts).values({
      name: 'Epaper Display Layout',
      structure: JSON.stringify(epaperLayoutStructure),
      status: 'published',
      custom_css: `
/* Epaper Layout Custom CSS */
.epaper-header-row {
  border-bottom: 2px solid #e5e7eb;
}

.epaper-main-display {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
}

.epaper-controls-column {
  padding-left: 20px;
}

.thumbnail-nav {
  max-height: 200px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .epaper-controls-column {
    padding-left: 0;
    margin-top: 20px;
  }
}
      `,
      custom_js: ''
    }).returning();

    console.log('✅ Epaper Display Layout created successfully!');
    console.log('Layout ID:', result[0]?.id);
    
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      console.log('⚠️  Epaper Display Layout already exists');
    } else {
      console.error('❌ Error creating layout:', error);
    }
  }
}

createEpaperLayout();