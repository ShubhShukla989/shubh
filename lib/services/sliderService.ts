/**
 * Slider Service - API client for slider management
 * Handles all slider and slide-related API calls
 */

import { Slider } from '@/lib/types';

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

export interface SlideData {
  id?: number;
  imageUrl: string;
  caption?: string;
  alt: string;
  link?: string;
  position: number;
  visible: boolean;
}

export interface SliderFormData {
  title: string;
  alias: string;
  description?: string;
  status: 'Active' | 'Inactive';
  config: SliderConfig;
  slides?: SlideData[];
}

export interface SliderListResponse {
  sliders: Slider[];
  total: number;
  page: number;
  limit: number;
}

class SliderService {
  private baseUrl = '/api/sliders';

  /**
   * Fetch all sliders with optional filters
   */
  async getSliders(params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<SliderListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${this.baseUrl}?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch sliders');
    }
    return response.json();
  }

  /**
   * Fetch a single slider by ID
   */
  async getSlider(id: number): Promise<Slider> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch slider');
    }
    return response.json();
  }

  /**
   * Fetch slider by alias (for frontend)
   */
  async getSliderByAlias(alias: string): Promise<Slider> {
    const response = await fetch(`${this.baseUrl}/alias/${alias}`);
    if (!response.ok) {
      throw new Error('Failed to fetch slider');
    }
    return response.json();
  }

  /**
   * Create a new slider
   */
  async createSlider(data: SliderFormData): Promise<Slider> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create slider');
    }
    return response.json();
  }

  /**
   * Update an existing slider
   */
  async updateSlider(id: number, data: SliderFormData): Promise<Slider> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update slider');
    }
    return response.json();
  }

  /**
   * Delete a slider
   */
  async deleteSlider(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete slider');
    }
  }

  /**
   * Add slide to slider
   */
  async addSlide(sliderId: number, data: SlideData): Promise<SlideData> {
    const response = await fetch(`${this.baseUrl}/${sliderId}/slides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add slide');
    }
    return response.json();
  }

  /**
   * Update slide
   */
  async updateSlide(sliderId: number, slideId: number, data: Partial<SlideData>): Promise<SlideData> {
    const response = await fetch(`${this.baseUrl}/${sliderId}/slides/${slideId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update slide');
    }
    return response.json();
  }

  /**
   * Delete slide
   */
  async deleteSlide(sliderId: number, slideId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${sliderId}/slides/${slideId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete slide');
    }
  }

  /**
   * Reorder slides
   */
  async reorderSlides(sliderId: number, order: number[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${sliderId}/slides/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    });
    if (!response.ok) {
      throw new Error('Failed to reorder slides');
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
   * Get default slider config
   */
  getDefaultConfig(): SliderConfig {
    return {
      autoplay: true,
      interval: 5000,
      transition: 'slide',
      pauseOnHover: true,
      showArrows: true,
      showDots: true,
      lazyLoad: true,
      lazyLoadDistance: 200,
      order: 'manual',
      slidesPerView: {
        desktop: 1,
        tablet: 1,
        mobile: 1,
      },
    };
  }
}

export const sliderService = new SliderService();
