import { Category } from '../types';

function makeCategory(
  id: string,
  name: string,
  icon: string,
  color: string,
  type: Category['type'],
): Category {
  return { id, name, icon, color, type, isDefault: true };
}

export const DEFAULT_CATEGORIES: Category[] = [
  makeCategory('cat-groceries', 'Supermercado', 'shopping-bag', '#F97316', 'expense'),
  makeCategory('cat-restaurants', 'Restaurante', 'coffee', '#F97316', 'expense'),
  makeCategory('cat-fuel', 'Combustível', 'truck', '#3B82F6', 'expense'),
  makeCategory('cat-ride-hailing', 'Táxi / Uber', 'map-pin', '#3B82F6', 'expense'),
  makeCategory('cat-rent', 'Renda', 'home', '#8B5CF6', 'expense'),
  makeCategory('cat-utilities', 'Água / Luz', 'droplet', '#8B5CF6', 'expense'),
  makeCategory('cat-pharmacy', 'Farmácia', 'heart', '#EF4444', 'expense'),
  makeCategory('cat-consultation', 'Consulta', 'activity', '#EF4444', 'expense'),
  makeCategory('cat-clothing', 'Roupa', 'shopping-cart', '#EC4899', 'expense'),
  makeCategory('cat-household', 'Casa e outros', 'package', '#EC4899', 'expense'),
  makeCategory('cat-cinema', 'Cinema', 'film', '#EAB308', 'expense'),
  makeCategory('cat-events', 'Eventos', 'star', '#EAB308', 'expense'),
  makeCategory('cat-courses', 'Cursos', 'book', '#14B8A6', 'expense'),
  makeCategory('cat-books', 'Livros', 'book-open', '#14B8A6', 'expense'),
  makeCategory('cat-streaming', 'Streaming', 'film', '#6366F1', 'expense'),
  makeCategory('cat-mobile', 'Internet / Telemóvel', 'smartphone', '#6366F1', 'expense'),
  makeCategory('cat-others-exp', 'Outros gastos', 'tag', '#84CC16', 'expense'),

  makeCategory('cat-salary', 'Salário', 'briefcase', '#22C55E', 'income'),
  makeCategory('cat-freelance', 'Freelance', 'trending-up', '#06B6D4', 'income'),
  makeCategory('cat-investments', 'Investimentos', 'activity', '#A855F7', 'income'),
  makeCategory('cat-gifts', 'Presentes', 'gift', '#F43F5E', 'income'),
  makeCategory('cat-others-inc', 'Outras receitas', 'tag', '#84CC16', 'income'),
];

