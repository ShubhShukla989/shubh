// Efficient ID generation utility
export function generateId(prefix: string = ''): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    const uuid = crypto.randomUUID();
    return prefix ? `${prefix}-${uuid}` : uuid;
  }
  
  // Fallback for older browsers - more efficient than Date.now() + Math.random()
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const id = `${timestamp}${randomPart}`;
  
  return prefix ? `${prefix}-${id}` : id;
}

// Specific generators for different entity types
export const generateRowId = () => generateId('row');
export const generateColumnId = () => generateId('col');
export const generateWidgetId = () => generateId('widget');
export const generateNestedRowId = () => generateId('nested-row');

// Ensure uniqueness within a collection
export function generateUniqueId(prefix: string, existingIds: string[]): string {
  let id = generateId(prefix);
  let attempts = 0;
  const maxAttempts = 10;
  
  while (existingIds.includes(id) && attempts < maxAttempts) {
    id = generateId(prefix);
    attempts++;
  }
  
  // If still not unique after max attempts, add timestamp suffix
  if (existingIds.includes(id)) {
    id = `${id}-${Date.now()}`;
  }
  
  return id;
}