export const SYMBOL_CATEGORIES = [
  { id: 'people', label: '人物', icon: '👤' },
  { id: 'animals', label: '動物', icon: '🐾' },
  { id: 'places', label: '場所', icon: '🏠' },
  { id: 'objects', label: '物体', icon: '📦' },
  { id: 'actions', label: '行動', icon: '🏃' },
  { id: 'emotions', label: '感情', icon: '💭' },
  { id: 'nature', label: '自然', icon: '🌿' },
  { id: 'colors', label: '色', icon: '🎨' },
  { id: 'numbers', label: '数字', icon: '🔢' },
  { id: 'abstract', label: '抽象概念', icon: '✨' },
] as const;

export function getCategoryLabel(categoryId: string): string {
  const category = SYMBOL_CATEGORIES.find((c) => c.id === categoryId);
  return category?.label || categoryId;
}

export function getCategoryIcon(categoryId: string): string {
  const category = SYMBOL_CATEGORIES.find((c) => c.id === categoryId);
  return category?.icon || '❓';
}
