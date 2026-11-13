/** Per-serving nutrition. Values are typical estimates from common food tables. */
export type Food = {
  id: string;
  name: string;
  serving: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  category: FoodCategory;
  custom?: boolean;
};

export type FoodCategory =
  | 'Desi'
  | 'Protein'
  | 'Breakfast'
  | 'Grains'
  | 'Dairy'
  | 'Fruit'
  | 'Vegetables'
  | 'Snacks'
  | 'Drinks'
  | 'Fats'
  | 'My foods';

export const FOOD_CATEGORIES: (FoodCategory | 'All')[] = [
  'All', 'Desi', 'Protein', 'Breakfast', 'Grains', 'Dairy', 'Fruit', 'Vegetables', 'Snacks', 'Drinks', 'Fats', 'My foods',
];

type Row = [string, string, string, number, number, number, number, FoodCategory];

const rows: Row[] = [
  ['oats', 'Oatmeal, cooked in water', '1 cup (234 g)', 166, 6, 28, 3.6, 'Breakfast'],
  ['egg', 'Egg, boiled', '1 large', 78, 6.3, 0.6, 5.3, 'Protein'],
  ['eggw', 'Egg whites', '3 whites', 51, 10.8, 0.7, 0.2, 'Protein'],
  ['omelette', 'Vegetable omelette, 2 eggs', '1 plate', 210, 14, 4, 15, 'Breakfast'],
  ['wbread', 'Whole-wheat bread', '1 slice', 80, 4, 14, 1, 'Grains'],
  ['roti', 'Chapati / roti', '1 medium (40 g)', 120, 3.5, 18, 3.7, 'Desi'],
  ['paratha', 'Plain paratha', '1 piece', 260, 5, 32, 12, 'Desi'],
  ['greek', 'Greek yogurt, low-fat', '170 g', 100, 17, 6, 0.7, 'Dairy'],
  ['dahi', 'Dahi (plain yogurt)', '1 cup (245 g)', 150, 8.5, 11.4, 8, 'Dairy'],
  ['milk', 'Milk, low-fat', '1 cup (240 ml)', 102, 8, 12, 2.4, 'Dairy'],
  ['chai', 'Doodh patti chai with sugar', '1 cup', 120, 3, 17, 4, 'Drinks'],
  ['paneer', 'Paneer', '100 g', 265, 18, 1.2, 20.8, 'Dairy'],
  ['cottage', 'Cottage cheese, low-fat', '½ cup', 90, 12, 5, 2.5, 'Dairy'],
  ['cheddar', 'Cheddar cheese', '28 g', 113, 7, 0.4, 9.3, 'Dairy'],
  ['banana', 'Banana', '1 medium', 105, 1.3, 27, 0.4, 'Fruit'],
  ['apple', 'Apple', '1 medium', 95, 0.5, 25, 0.3, 'Fruit'],
  ['orange', 'Orange', '1 medium', 62, 1.2, 15.4, 0.2, 'Fruit'],
  ['berries', 'Mixed berries', '1 cup', 70, 1, 17, 0.5, 'Fruit'],
  ['dates', 'Dates', '3 pieces', 60, 0.5, 16, 0, 'Fruit'],
  ['guava', 'Guava', '1 medium', 37, 1.4, 8, 0.5, 'Fruit'],
  ['avocado', 'Avocado', '½ fruit', 160, 2, 8.5, 14.7, 'Fruit'],
  ['almonds', 'Almonds', '28 g (23 nuts)', 164, 6, 6, 14, 'Snacks'],
  ['walnuts', 'Walnuts', '28 g', 185, 4.3, 3.9, 18.5, 'Snacks'],
  ['pb', 'Peanut butter', '2 tbsp', 190, 7, 8, 16, 'Snacks'],
  ['whey', 'Whey protein shake (water)', '1 scoop', 120, 24, 3, 1.5, 'Protein'],
  ['pbar', 'Protein bar', '1 bar', 200, 20, 22, 7, 'Snacks'],
  ['dchoc', 'Dark chocolate 70%', '20 g', 120, 1.5, 9, 8.5, 'Snacks'],
  ['hummus', 'Hummus', '2 tbsp', 70, 2, 4, 5, 'Snacks'],
  ['rice', 'White rice, cooked', '1 cup', 205, 4.3, 45, 0.4, 'Grains'],
  ['brice', 'Brown rice, cooked', '1 cup', 216, 5, 45, 1.8, 'Grains'],
  ['quinoa', 'Quinoa, cooked', '1 cup', 222, 8, 39, 3.6, 'Grains'],
  ['pasta', 'Whole-wheat pasta, cooked', '1 cup', 174, 7.5, 37, 0.8, 'Grains'],
  ['naan', 'Naan', '1 piece', 260, 9, 45, 5, 'Desi'],
  ['spotato', 'Sweet potato, baked', '1 medium', 112, 2, 26, 0.1, 'Vegetables'],
  ['potato', 'Potato, boiled', '1 medium', 130, 3, 30, 0.2, 'Vegetables'],
  ['chicken', 'Chicken breast, grilled', '100 g', 165, 31, 0, 3.6, 'Protein'],
  ['tikka', 'Chicken tikka', '150 g', 230, 35, 4, 8, 'Desi'],
  ['karahi', 'Chicken karahi', '1 cup', 350, 28, 8, 23, 'Desi'],
  ['biryani', 'Chicken biryani', '1 plate (300 g)', 490, 22, 60, 17, 'Desi'],
  ['beef', 'Lean beef, grilled', '100 g', 250, 26, 0, 15, 'Protein'],
  ['mutton', 'Mutton curry', '1 cup', 400, 26, 8, 29, 'Desi'],
  ['salmon', 'Salmon, baked', '100 g', 208, 20, 0, 13, 'Protein'],
  ['fish', 'White fish, grilled', '100 g', 120, 25, 0, 1.5, 'Protein'],
  ['tuna', 'Tuna in water', '100 g', 116, 26, 0, 1, 'Protein'],
  ['prawns', 'Prawns, cooked', '100 g', 99, 24, 0.2, 0.3, 'Protein'],
  ['tofu', 'Tofu, firm', '100 g', 144, 17, 3, 9, 'Protein'],
  ['daal', 'Daal tadka', '1 cup', 220, 12, 30, 6, 'Desi'],
  ['lentils', 'Lentils, boiled', '1 cup', 230, 18, 40, 0.8, 'Protein'],
  ['chana', 'Chana (chickpea curry)', '1 cup', 269, 14.5, 45, 4.2, 'Desi'],
  ['rajma', 'Rajma (kidney beans)', '1 cup', 225, 15, 40, 1, 'Desi'],
  ['saag', 'Saag (spinach curry)', '1 cup', 180, 6, 12, 12, 'Desi'],
  ['sabzi', 'Mixed vegetable sabzi', '1 cup', 150, 4, 15, 8, 'Desi'],
  ['raita', 'Cucumber raita', '1 cup', 110, 6, 9, 5.5, 'Dairy'],
  ['salad', 'Green salad with olive oil', '1 bowl', 120, 2, 7, 10, 'Vegetables'],
  ['broccoli', 'Broccoli, steamed', '1 cup', 55, 3.7, 11, 0.6, 'Vegetables'],
  ['cauli', 'Cauliflower rice', '1 cup', 25, 2, 5, 0.3, 'Vegetables'],
  ['lsoup', 'Lentil soup', '1 bowl', 180, 11, 28, 3, 'Vegetables'],
  ['csoup', 'Chicken clear soup', '1 bowl', 120, 12, 8, 4, 'Protein'],
  ['oil', 'Olive oil', '1 tbsp', 119, 0, 0, 13.5, 'Fats'],
  ['butter', 'Butter', '1 tbsp', 102, 0.1, 0, 11.5, 'Fats'],
  ['samosa', 'Samosa', '1 piece', 252, 4, 24, 16, 'Desi'],
  ['pakora', 'Pakora', '5 pieces', 220, 5, 20, 13, 'Desi'],
  ['lassi', 'Sweet lassi', '1 glass', 260, 8, 40, 7, 'Drinks'],
  ['juice', 'Orange juice, fresh', '1 cup', 112, 1.7, 26, 0.5, 'Drinks'],
  ['soda', 'Soft drink', '1 can (330 ml)', 140, 0, 39, 0, 'Drinks'],
  ['coffee', 'Black coffee', '1 cup', 2, 0.3, 0, 0, 'Drinks'],
  ['gtea', 'Green tea', '1 cup', 2, 0, 0, 0, 'Drinks'],
  ['smoothie', 'Banana peanut smoothie', '1 glass', 320, 12, 45, 11, 'Drinks'],
];

export const FOODS: Food[] = rows.map(([id, name, serving, kcal, protein, carbs, fat, category]) => ({
  id, name, serving, kcal, protein, carbs, fat, category,
}));

export const FOOD_BY_ID: Record<string, Food> = Object.fromEntries(FOODS.map((f) => [f.id, f]));
