export interface Recipe {
  id: number;
  title: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  imageUrl: string;
  tags: string[];
  difficulty?: string;
  sustainability?: number;
  costSaving?: number;
}

export interface Ingredient {
  name: string;
  freshness: 'fresh' | 'use soon' | 'expired';
  expiryDate?: string;
  quantity?: string;
}