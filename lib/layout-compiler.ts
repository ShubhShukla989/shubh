/**
 * Layout Pre-Compilation System
 * Compiles layout JSON to static HTML for 5-20x faster rendering
 * 
 * Current: JSON → Parse → Render → HTML (50ms)
 * Phase 2: HTML from Redis (3-8ms)
 * 
 * Security: XSS sanitization with DOMPurify
 */

import DOMPurify from 'isomorphic-dompurify';

export interface CompiledLayout {
  html: string;
  css: string;
  js: string;
  metadata: {
    layoutName: string;
    compiledAt: number;
    widgetCount: number;
    version: string;
  };
}

/**
 * Compile layout JSON to static HTML with XSS protection
 */
export async function compileLayout(layout: any): Promise<CompiledLayout> {
  const startTime = Date.now();
  
  try {
    // Parse structure
    const structure = typeof layout.structure === 'string' 
      ? JSON.parse(layout.structure) 
      : layout.structure;
    
    if (!structure || !structure.rows) {
      throw new Error('Invalid layout structure');
    }
    
    // Compile HTML
    const rawHtml = compileLayoutHTML(structure, layout.name);
    
    // 🔒 SECURITY: Sanitize HTML to prevent XSS attacks
    const html = sanitizeHTML(rawHtml);
    
    // Extract and sanitize CSS
    const rawCss = layout.custom_css || '';
    const css = sanitizeCSS(rawCss);
    
    // Extract and sanitize JS (disabled for security)
    const js = ''; // Custom JS disabled for security
    if (layout.custom_js) {
      console.warn(`⚠️ Custom JS disabled for security in layout "${layout.name}"`);
    }
    
    // Count widgets
    let widgetCount = 0;
    structure.rows?.forEach((row: any) => {
      row.columns?.forEach((col: any) => {
        widgetCount += col.widgets?.length || 0;
      });
    });
    
    const compiledLayout: CompiledLayout = {
      html,
      css,
      js,
      metadata: {
        layoutName: layout.name,
        compiledAt: Date.now(),
        widgetCount,
        version: '2.0.0' // Updated version with XSS protection
      }
    };
    
    const duration = Date.now() - startTime;
    console.log(`✅ Compiled layout "${layout.name}" in ${duration}ms (${widgetCount} widgets) [XSS Protected]`);
    
    return compiledLayout;
  } catch (error) {
    console.error(`❌ Failed to compile layout "${layout.name}":`, error);
    throw error;
  }
}

/**
 * Compile layout structure to HTML
 */
function compileLayoutHTML(structure: any, layoutName: string): string {
  let html = `<div class="layout-renderer compiled-layout" data-layout="${escapeHtml(layoutName)}" data-compiled="true">\n`;
  
  // Compile rows
  if (structure.rows && Array.isArray(structure.rows)) {
    for (const row of structure.rows) {
      html += compileRow(row);
    }
  }
  
  html += `</div>\n`;
  
  return html;
}

/**
 * Compile a single row
 */
function compileRow(row: any): string {
  const rowClass = row.properties?.cssClass || row.cssClass || '';
  const rowStyle = row.properties?.customStyle || row.properties?.customCss || row.customStyle || '';
  
  let html = `  <div class="layout-row ${escapeHtml(rowClass)}" data-row-id="${escapeHtml(row.id)}"`;
  
  if (rowStyle) {
    html += ` style="${escapeHtml(rowStyle)}"`;
  }
  
  html += `>\n`;
  html += `    <div class="flex flex-wrap w-full">\n`;
  
  // Compile columns
  if (row.columns && Array.isArray(row.columns)) {
    for (const column of row.columns) {
      html += compileColumn(column);
    }
  }
  
  html += `    </div>\n`;
  html += `  </div>\n`;
  
  return html;
}

/**
 * Compile a single column
 */
function compileColumn(column: any): string {
  const columnClass = column.properties?.cssClass || column.cssClass || '';
  const columnStyle = column.properties?.customStyle || column.customStyle || '';
  
  // Get column width
  const width = getColumnWidth(column);
  
  let html = `      <div class="layout-column ${escapeHtml(columnClass)}" data-column-id="${escapeHtml(column.id)}" style="flex: ${width}"`;
  
  if (columnStyle) {
    html += ` style="${escapeHtml(columnStyle)}"`;
  }
  
  html += `>\n`;
  
  // Compile widgets
  if (column.widgets && Array.isArray(column.widgets)) {
    for (const widget of column.widgets) {
      html += compileWidget(widget);
    }
  }
  
  html += `      </div>\n`;
  
  return html;
}

/**
 * Get column width from CSS class or properties
 */
function getColumnWidth(column: any): string {
  const cssClass = column.properties?.cssClass || column.cssClass || '';
  
  // Bootstrap column classes (col-1 to col-12)
  const colMatch = cssClass.match(/col-(\d+)/);
  if (colMatch) {
    const colNum = parseInt(colMatch[1]);
    return `0 0 ${(colNum / 12) * 100}%`;
  }
  
  // Default: equal width
  return '1';
}

/**
 * Compile a single widget to HTML
 */
function compileWidget(widget: any): string {
  if (!widget || !widget.type) {
    return '';
  }
  
  const widgetClass = widget.properties?.cssClass || widget.cssClass || '';
  const widgetStyle = widget.properties?.customStyle || widget.customStyle || '';
  
  let html = `        <div class="widget widget-${escapeHtml(widget.type)} ${escapeHtml(widgetClass)}" data-widget-id="${escapeHtml(widget.id)}" data-widget-type="${escapeHtml(widget.type)}"`;
  
  if (widgetStyle) {
    html += ` style="${escapeHtml(widgetStyle)}"`;
  }
  
  html += `>\n`;
  
  // Compile widget content based on type
  html += compileWidgetContent(widget);
  
  html += `        </div>\n`;
  
  return html;
}

/**
 * Compile widget content based on widget type
 */
function compileWidgetContent(widget: any): string {
  const config = widget.config || {};
  
  switch (widget.type) {
    case 'text':
      return compileTextWidget(config);
    
    case 'heading':
    case 'heading-widget':
      return compileHeadingWidget(config);
    
    case 'image':
      return compileImageWidget(config);
    
    case 'button':
      return compileButtonWidget(config);
    
    case 'embed':
    case 'html':
      return compileEmbedWidget(config);
    
    case 'ticker':
      return compileTickerWidget(config);
    
    case 'social':
      return compileSocialWidget(config);
    
    case 'menu':
    case 'navigation':
      return compileMenuWidget(config);
    
    // Epaper widgets - these need to remain dynamic
    case 'epaper-display':
    case 'epaper-page-display':
    case 'epaper-archive':
    case 'epaper-calendar':
    case 'epaper-pagination':
    case 'epaper-pdf-download':
    case 'epaper-thumb-navigation':
    case 'epaper-clip-share':
    case 'epaper-clip-display':
    case 'epaper-zoom':
    case 'epaper-featured':
    case 'featured-editions':
    case 'page-download':
    case 'epaper-area-map':
    case 'social-sharing':
      return compileDynamicWidget(widget);
    
    default:
      return `          <div class="text-gray-400 text-sm">Widget type "${escapeHtml(widget.type)}" (dynamic)</div>\n`;
  }
}

/**
 * Compile text widget
 */
function compileTextWidget(config: any): string {
  const content = config.content || config.text || '';
  return `          <div class="widget-text prose max-w-none">${content}</div>\n`;
}

/**
 * Compile heading widget
 */
function compileHeadingWidget(config: any): string {
  const title = escapeHtml(config.title || config.text || 'Heading');
  const level = config.level || 'h2';
  const cssClasses = config.cssClasses || '';
  
  return `          <${level} class="widget-heading ${escapeHtml(cssClasses)}">${title}</${level}>\n`;
}

/**
 * Compile image widget
 */
function compileImageWidget(config: any): string {
  if (!config.url) {
    return `          <div class="text-gray-400 text-sm">No image URL</div>\n`;
  }
  
  const url = escapeHtml(config.url);
  const alt = escapeHtml(config.alt || '');
  const cssClasses = config.cssClasses || 'w-full rounded-lg shadow-md';
  
  return `          <img src="${url}" alt="${alt}" class="${escapeHtml(cssClasses)}" loading="lazy" />\n`;
}

/**
 * Compile button widget
 */
function compileButtonWidget(config: any): string {
  const text = escapeHtml(config.text || 'Button');
  const link = escapeHtml(config.link || '#');
  const newTab = config.newTab ? ' target="_blank" rel="noopener noreferrer"' : '';
  const cssClasses = config.cssClasses || 'inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium';
  
  return `          <a href="${link}" class="${escapeHtml(cssClasses)}"${newTab}>${text}</a>\n`;
}

/**
 * Compile embed/HTML widget
 */
function compileEmbedWidget(config: any): string {
  const code = config.code || config.html || '';
  return `          <div class="widget-embed">${code}</div>\n`;
}

/**
 * Compile ticker widget
 */
function compileTickerWidget(config: any): string {
  const text = escapeHtml(config.text || 'Ticker text');
  return `          <div class="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
            <div class="animate-marquee whitespace-nowrap">${text}</div>
          </div>\n`;
}

/**
 * Compile social widget
 */
function compileSocialWidget(config: any): string {
  const links = config.links || [];
  
  if (links.length === 0) {
    return `          <div class="text-gray-400 text-sm">No social links</div>\n`;
  }
  
  let html = `          <div class="flex gap-3">\n`;
  
  for (const link of links) {
    const url = escapeHtml(link.url || '#');
    const icon = escapeHtml(link.icon || '🔗');
    html += `            <a href="${url}" target="_blank" rel="noopener noreferrer" class="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
              <span class="text-xl">${icon}</span>
            </a>\n`;
  }
  
  html += `          </div>\n`;
  
  return html;
}

/**
 * Compile menu/navigation widget
 */
function compileMenuWidget(config: any): string {
  const items = config.items || [];
  
  if (items.length === 0) {
    return `          <div class="text-gray-400 text-sm">No menu items</div>\n`;
  }
  
  let html = `          <nav class="flex gap-4">\n`;
  
  for (const item of items) {
    const url = escapeHtml(item.url || '#');
    const label = escapeHtml(item.label || item.title || 'Link');
    html += `            <a href="${url}" class="text-gray-700 hover:text-blue-600 transition-colors">${label}</a>\n`;
  }
  
  html += `          </nav>\n`;
  
  return html;
}

/**
 * Compile dynamic widget (placeholder for client-side rendering)
 */
function compileDynamicWidget(widget: any): string {
  // These widgets need client-side rendering
  // Output a placeholder that will be hydrated on the client
  const widgetData = JSON.stringify({
    type: widget.type,
    id: widget.id,
    config: widget.config || {}
  });
  
  return `          <div class="dynamic-widget-placeholder" data-widget="${escapeHtml(widgetData)}">
            <div class="text-gray-400 text-sm">Loading ${escapeHtml(widget.type)}...</div>
          </div>\n`;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Pre-compile and cache layout with new key structure
 */
export async function preCompileAndCacheLayout(layout: any): Promise<void> {
  // Compilation disabled — layouts fetched fresh from DB on every request
  console.log(`[layout-compiler] skipping pre-compile for: ${layout.name}`);
}

export async function getCompiledLayout(layoutName: string): Promise<CompiledLayout | null> {
  // Always return null so the renderer fetches fresh from DB
  return null;
}

/**
 * 🔒 SECURITY: Sanitize HTML to prevent XSS attacks
 * 
 * Uses DOMPurify to remove dangerous elements and attributes
 */
function sanitizeHTML(html: string): string {
  if (!html) return '';
  
  try {
    const clean = DOMPurify.sanitize(html, {
      // Allowed HTML tags
      ALLOWED_TAGS: [
        // Structure
        'div', 'span', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside',
        // Text
        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 'small', 'mark',
        // Lists
        'ul', 'ol', 'li', 'dl', 'dt', 'dd',
        // Links & Media
        'a', 'img', 'picture', 'source', 'video', 'audio',
        // Tables
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
        // Forms (read-only)
        'button', 'label',
        // Other
        'br', 'hr', 'blockquote', 'pre', 'code', 'time'
      ],
      
      // Allowed attributes
      ALLOWED_ATTR: [
        'class', 'id', 'style', 'data-*',
        'href', 'target', 'rel',
        'src', 'alt', 'title', 'width', 'height', 'loading',
        'type', 'disabled', 'readonly',
        'colspan', 'rowspan',
        'datetime'
      ],
      
      // Forbidden tags (explicitly blocked)
      FORBID_TAGS: [
        'script', 'iframe', 'object', 'embed', 'applet',
        'form', 'input', 'textarea', 'select', 'option',
        'base', 'link', 'meta', 'style'
      ],
      
      // Forbidden attributes (explicitly blocked)
      FORBID_ATTR: [
        'onerror', 'onclick', 'onload', 'onmouseover', 'onmouseout',
        'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown',
        'onkeyup', 'onkeypress', 'ondblclick', 'oncontextmenu'
      ],
      
      // Allow data attributes
      ALLOW_DATA_ATTR: true,
      
      // Keep safe URLs only
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      
      // Return DOM instead of string for better performance
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      
      // Sanitize in place
      IN_PLACE: false
    });
    
    return clean;
  } catch (error) {
    console.error('❌ HTML sanitization failed:', error);
    return ''; // Return empty string on error (fail secure)
  }
}

/**
 * 🔒 SECURITY: Sanitize CSS to prevent CSS injection attacks
 */
function sanitizeCSS(css: string): string {
  if (!css) return '';
  
  try {
    // Remove dangerous CSS patterns
    let clean = css;
    
    // Remove @import (can load external malicious CSS)
    clean = clean.replace(/@import\s+/gi, '');
    
    // Remove javascript: URLs
    clean = clean.replace(/javascript:/gi, '');
    
    // Remove expression() (IE-specific XSS vector)
    clean = clean.replace(/expression\s*\(/gi, '');
    
    // Remove behavior: (IE-specific XSS vector)
    clean = clean.replace(/behavior\s*:/gi, '');
    
    // Remove -moz-binding (Firefox XSS vector)
    clean = clean.replace(/-moz-binding\s*:/gi, '');
    
    // Remove data: URLs (can contain scripts)
    clean = clean.replace(/url\s*\(\s*data:/gi, 'url(about:blank ');
    
    return clean;
  } catch (error) {
    console.error('❌ CSS sanitization failed:', error);
    return ''; // Return empty string on error (fail secure)
  }
}
