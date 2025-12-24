// Database Types

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  sort_order: number;
  created_at: string;
}

export interface Edition {
  id: number;
  title: string;
  alias: string | null;
  date: string;
  category_id: number | null;
  pdf_url: string | null;
  description: string | null;
  status: 'draft' | 'processing' | 'published' | 'scheduled';
  is_featured?: boolean;
  seo_h1?: string | null;
  seo_meta_description?: string | null;
  scheduled_date?: string | null;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  created_by_name?: string | null;
  updated_by_name?: string | null;
  pages?: EditionPage[];
}

export interface EditionPage {
  id: number;
  edition_id: number;
  page_number: number;
  image_url: string;
  thumb_url: string | null;
  page_category_id: number | null;
  created_at: string;
}

export interface EditionPageArea {
  id: number;
  page_id: number;
  area_name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Page {
  id: number;
  title: string;
  alias: string;
  description: string | null;
  content: string | null;
  status: 'Public' | 'Private' | 'Draft';
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  og_image: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  twitter_image: string | null;
  header_code: string | null;
  footer_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface Slider {
  id: number;
  title: string;
  alias: string;
  description: string | null;
  status: 'Active' | 'Inactive';
  config: SliderConfig;
  slides: Slide[];
  created_at: string;
  updated_at: string;
}

export interface Slide {
  id: number;
  slider_id: number;
  image_url: string;
  caption: string | null;
  alt: string;
  link: string | null;
  position: number;
  visible: boolean;
  created_at: string;
}

export interface SliderConfig {
  autoplay: boolean;
  interval: number;
  transition: 'slide' | 'fade';
  pauseOnHover: boolean;
  showArrows: boolean;
  showDots: boolean;
  lazyLoad: boolean;
  lazyLoadDistance: number;
  order: 'ascending' | 'descending' | 'manual';
  slidesPerView: {
    desktop: number;
    tablet: number;
    mobile: number;
  };
}

export interface User {
  id: number;
  fullname: string;
  email: string;
  password_hash: string;
  role: 'Super Admin' | 'Admin' | 'Sub-Admin' | 'Editor';
  mobile: string | null;
  country_code: string | null;
  address: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  zip: string | null;
  status: 'Active' | 'Inactive' | 'Suspended';
  created_at: string;
  updated_at: string;
}

export interface Layout {
  id: number;
  name: string;
  structure: LayoutStructure;
  status: 'Draft' | 'Published';
  created_at: string;
  updated_at: string;
}

export interface LayoutStructure {
  rows: LayoutRow[];
}

export interface LayoutRow {
  id: string;
  columns: LayoutColumn[];
}

export interface LayoutColumn {
  id: string;
  width: number;
  widgets: Widget[];
}

export interface Widget {
  id: string;
  type: 'text' | 'image' | 'ticker' | 'social' | 'menu' | 'html' | 'video' | 'ad';
  config: Record<string, any>;
}

export interface Setting {
  id: number;
  key: string;
  value: string | null;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface Menu {
  id: number;
  name: string;
  location: string | null;
  items: MenuItem[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  label: string;
  url: string;
  target?: string;
  children?: MenuItem[];
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
}
