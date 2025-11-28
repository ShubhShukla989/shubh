export interface Widget {
  id: string;
  type: 'ticker' | 'social' | 'image' | 'text' | 'button' | 'menu' | 'embed' | 'navigation' | 'slideshow' | 'html' | 'tinymce' | 'page-content' | 'infobox' | 'cards' | 'heading' | 'video' | 'audio' | 'datetime' | 'reusable' | 'epaper-category' | 'epaper-gallery' | 'epaper-featured' | 'pwa-install' | 'youtube' | 'rss' | 'epaper-archive' | 'epaper-calendar' | 'epaper-pagination' | 'epaper-pdf-download' | 'epaper-thumb-navigation' | 'epaper-clip-share' | 'epaper-clip-display' | 'epaper-display' | 'epaper-zoom' | 'social-sharing' | 'page-download' | 'epaper-area-map';
  config: any;
}

export interface ColumnProperties {
  extraSmallWidth?: string;
  smallWidth?: string;
  mediumWidth?: string;
  largeWidth?: string;
  extraLargeWidth?: string;
  cssClass?: string;
  customStyle?: string;
}

export interface Column {
  id: string;
  width: number;
  widgets: Widget[];
  rows: Row[];
  properties?: ColumnProperties;
}

export interface Row {
  id: string;
  columns: Column[];
}

export interface LayoutStructure {
  rows: Row[];
}
