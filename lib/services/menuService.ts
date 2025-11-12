/**
 * Menu Service - API client for menu management
 * Handles menu integration for pages
 */

export interface MenuLocation {
  id: string;
  name: string;
  label: string;
}

export interface MenuItemData {
  title: string;
  url: string;
  alias?: string;
  position: 'start' | 'end' | string; // 'after-{itemId}' for specific position
  visible: 'public' | 'logged-in' | 'role-based';
  target?: '_blank' | '_self';
  parentId?: string | null;
}

export interface MenuItemResponse {
  id: string;
  title: string;
  url: string;
  alias?: string;
  position: number;
  visible: string;
  target?: string;
  parentId?: string | null;
  children?: MenuItemResponse[];
}

export interface MenuResponse {
  id: string;
  name: string;
  location: string;
  items: MenuItemResponse[];
}

class MenuService {
  private baseUrl = '/api/menu';

  /**
   * Get all available menu locations
   */
  async getMenuLocations(): Promise<MenuLocation[]> {
    const response = await fetch(`${this.baseUrl}/locations`);
    if (!response.ok) {
      throw new Error('Failed to fetch menu locations');
    }
    return response.json();
  }

  /**
   * Get a specific menu with its items
   */
  async getMenu(menuId: string): Promise<MenuResponse> {
    const response = await fetch(`${this.baseUrl}/${menuId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch menu');
    }
    return response.json();
  }

  /**
   * Get all menus
   */
  async getAllMenus(): Promise<MenuResponse[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch menus');
    }
    return response.json();
  }

  /**
   * Add a menu item
   */
  async addMenuItem(menuId: string, data: MenuItemData): Promise<MenuItemResponse> {
    const response = await fetch(`${this.baseUrl}/${menuId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add menu item');
    }
    return response.json();
  }

  /**
   * Update a menu item
   */
  async updateMenuItem(
    menuId: string,
    itemId: string,
    data: Partial<MenuItemData>
  ): Promise<MenuItemResponse> {
    const response = await fetch(`${this.baseUrl}/${menuId}/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update menu item');
    }
    return response.json();
  }

  /**
   * Delete a menu item
   */
  async deleteMenuItem(menuId: string, itemId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${menuId}/items/${itemId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete menu item');
    }
  }

  /**
   * Find menu items by page alias
   */
  async findMenuItemsByAlias(alias: string): Promise<Array<{ menuId: string; itemId: string }>> {
    const response = await fetch(`${this.baseUrl}/find-by-alias?alias=${alias}`);
    if (!response.ok) {
      throw new Error('Failed to find menu items');
    }
    return response.json();
  }

  /**
   * Update menu items when page alias changes
   */
  async updateMenuItemsAlias(oldAlias: string, newAlias: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/update-alias`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldAlias, newAlias }),
    });
    if (!response.ok) {
      throw new Error('Failed to update menu items');
    }
  }
}

export const menuService = new MenuService();
