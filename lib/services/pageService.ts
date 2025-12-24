/**
 * Page Service - API client for page management
 * Handles all page-related API calls with proper error handling
 */

import { Page } from '@/lib/types';

export interface PageListResponse {
  pages: Page[];
  total: number;
  page: number;
  limit: number;
}

export interface PageFormData {
  title: string;
  alias: string;
  description?: string;
  content?: string;
  status: 'Public' | 'Private' | 'Draft';
  seo?: {
    customTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    robots?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterCard?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    headerCode?: string;
    footerCode?: string;
  };
}

class PageService {
  private baseUrl = '/api/pages';

  /**
   * Fetch all pages with optional filters
   */
  async getPages(params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PageListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${this.baseUrl}?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch pages');
    }
    const result = await response.json();
    
    // Transform API response to expected format
    return {
      pages: result.data || [],
      total: result.data?.length || 0,
      page: 1,
      limit: 50
    };
  }

  /**
   * Fetch a single page by ID
   */
  async getPage(id: number): Promise<Page> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch page');
    }
    return response.json();
  }

  /**
   * Create a new page
   */
  async createPage(data: PageFormData): Promise<Page> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create page');
    }
    
    const result = await response.json();
    return result.data;
  }

  /**
   * Update an existing page
   */
  async updatePage(id: number, data: PageFormData): Promise<Page> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update page');
    }
    return response.json();
  }

  /**
   * Delete a page
   */
  async deletePage(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete page');
    }
  }

  /**
   * Generate slug from title
   */
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Check if alias is available
   */
  async checkAliasAvailability(alias: string, excludeId?: number): Promise<boolean> {
    const response = await fetch(
      `${this.baseUrl}/check-alias?alias=${alias}${excludeId ? `&excludeId=${excludeId}` : ''}`
    );
    const data = await response.json();
    return data.available;
  }
}

export const pageService = new PageService();
