/**
 * Original Nourish recipes. Nutrition is per serving and approximate;
 * carbs are net carbs (total carbs minus fibre).
 */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Tag = 'keto' | 'lowcarb' | 'highprotein' | 'vegetarian' | 'desi' | 'quick' | 'diabetic' | 'balanced';
export type Aisle = 'Produce' | 'Meat & fish' | 'Dairy & eggs' | 'Pantry' | 'Spices' | 'Frozen';

export type Ingredient = { qty: number | null; unit: string; name: string; aisle: Aisle };

export type Recipe = {
  id: string;
  title: string;
  summary: string;
  meals: MealType[];
  tags: Tag[];
  minutes: number;
  servings: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  ingredients: Ingredient[];
  steps: string[];
  tip?: string;
  video: string;
  hue: number;
};

const i = (qty: number | null, unit: string, name: string, aisle: Aisle): Ingredient => ({ qty, unit, name, aisle });

export const TAG_LABEL: Record<Tag, string> = {
  keto: 'Keto',
  lowcarb: 'Low carb',
  highprotein: 'High protein',
  vegetarian: 'Vegetarian',
  desi: 'Desi',
  quick: 'Under 20 min',
  diabetic: 'Blood-sugar friendly',
  balanced: 'Balanced',
};

export const RECIPES: Recipe[] = [
  {
    id: 'herb-eggs-avocado', title: 'Herby scrambled eggs with avocado', summary: 'Soft eggs folded with butter and fresh herbs, served with sliced avocado.',
    meals: ['breakfast'], tags: ['keto', 'lowcarb', 'quick', 'vegetarian', 'diabetic'], minutes: 10, servings: 2,
    kcal: 420, protein: 20, carbs: 4, fat: 35, fiber: 5,
    ingredients: [i(5, '', 'eggs', 'Dairy & eggs'), i(1, 'tbsp', 'butter', 'Dairy & eggs'), i(2, 'tbsp', 'chopped chives or coriander', 'Produce'), i(1, '', 'ripe avocado', 'Produce'), i(30, 'g', 'baby spinach', 'Produce'), i(null, '', 'salt and black pepper', 'Spices')],
    steps: ['Whisk the eggs with a pinch of salt.', 'Melt the butter in a non-stick pan over low heat.', 'Add the eggs and stir slowly with a spatula until just set, about 3 minutes.', 'Fold in the herbs and take the pan off the heat while the eggs still look glossy.', 'Serve with sliced avocado and spinach, and finish with black pepper.'],
    tip: 'Low heat is the secret. Pull the pan off before the eggs look done; they keep cooking on the plate.',
    video: 'how to make soft scrambled eggs', hue: 48,
  },
  {
    id: 'coconut-chia', title: 'Coconut chia pudding with berries', summary: 'Make it the night before. Creamy, fibre-rich and naturally low in sugar.',
    meals: ['breakfast', 'snack'], tags: ['keto', 'lowcarb', 'vegetarian'], minutes: 5, servings: 2,
    kcal: 310, protein: 7, carbs: 6, fat: 26, fiber: 11,
    ingredients: [i(240, 'ml', 'full-fat coconut milk', 'Pantry'), i(4, 'tbsp', 'chia seeds', 'Pantry'), i(0.5, 'tsp', 'vanilla extract', 'Pantry'), i(60, 'g', 'raspberries or strawberries', 'Produce'), i(1, 'tbsp', 'toasted coconut flakes', 'Pantry')],
    steps: ['Stir the coconut milk, chia seeds and vanilla together in a bowl.', 'Wait 5 minutes and stir again to break up clumps.', 'Cover and chill for at least 4 hours or overnight.', 'Spoon into two jars and top with berries and coconut flakes.'],
    video: 'coconut chia pudding recipe', hue: 330,
  },
  {
    id: 'masala-omelette', title: 'Desi masala omelette', summary: 'Onion, tomato, green chilli and coriander, the way it is made at home.',
    meals: ['breakfast'], tags: ['desi', 'keto', 'lowcarb', 'quick', 'vegetarian', 'highprotein', 'diabetic'], minutes: 10, servings: 1,
    kcal: 330, protein: 20, carbs: 5, fat: 25, fiber: 1,
    ingredients: [i(3, '', 'eggs', 'Dairy & eggs'), i(0.25, '', 'onion, finely chopped', 'Produce'), i(0.5, '', 'tomato, deseeded and chopped', 'Produce'), i(1, '', 'green chilli, chopped', 'Produce'), i(1, 'tbsp', 'chopped coriander', 'Produce'), i(0.25, 'tsp', 'turmeric', 'Spices'), i(1, 'tbsp', 'ghee or oil', 'Pantry')],
    steps: ['Beat the eggs with turmeric and a pinch of salt.', 'Stir in the onion, tomato, chilli and coriander.', 'Heat the ghee in a frying pan over medium heat.', 'Pour in the egg mix and cook until the edges set, about 2 minutes.', 'Fold in half and cook 1 more minute.'],
    video: 'desi masala omelette recipe', hue: 30,
  },
  {
    id: 'protein-oats', title: 'Protein overnight oats', summary: 'A filling, high-protein breakfast you can grab from the fridge.',
    meals: ['breakfast'], tags: ['balanced', 'highprotein', 'vegetarian'], minutes: 5, servings: 1,
    kcal: 420, protein: 32, carbs: 48, fat: 11, fiber: 7,
    ingredients: [i(45, 'g', 'rolled oats', 'Pantry'), i(1, 'scoop', 'vanilla whey or plant protein', 'Pantry'), i(150, 'ml', 'milk', 'Dairy & eggs'), i(80, 'g', 'Greek yogurt', 'Dairy & eggs'), i(1, 'tsp', 'chia seeds', 'Pantry'), i(0.5, '', 'banana, sliced', 'Produce')],
    steps: ['Mix the oats, protein powder and chia seeds in a jar.', 'Stir in the milk and yogurt until smooth.', 'Cover and chill overnight.', 'Top with banana before eating.'],
    video: 'protein overnight oats recipe', hue: 38,
  },
  {
    id: 'yogurt-walnut-bowl', title: 'Greek yogurt bowl with walnuts', summary: 'Thick yogurt, toasted walnuts, cinnamon and a few berries.',
    meals: ['breakfast', 'snack'], tags: ['lowcarb', 'highprotein', 'vegetarian', 'quick', 'diabetic'], minutes: 3, servings: 1,
    kcal: 330, protein: 24, carbs: 14, fat: 20, fiber: 3,
    ingredients: [i(200, 'g', 'plain Greek yogurt', 'Dairy & eggs'), i(25, 'g', 'walnuts', 'Pantry'), i(40, 'g', 'blueberries', 'Produce'), i(0.5, 'tsp', 'ground cinnamon', 'Spices')],
    steps: ['Toast the walnuts in a dry pan for 2 minutes.', 'Spoon the yogurt into a bowl.', 'Top with berries, walnuts and cinnamon.'],
    video: 'greek yogurt bowl ideas', hue: 220,
  },
  {
    id: 'paneer-bhurji', title: 'Paneer bhurji', summary: 'Crumbled paneer cooked with onion, tomato and warm spices.',
    meals: ['breakfast', 'lunch'], tags: ['desi', 'keto', 'lowcarb', 'vegetarian', 'highprotein'], minutes: 15, servings: 2,
    kcal: 380, protein: 22, carbs: 7, fat: 29, fiber: 2,
    ingredients: [i(200, 'g', 'paneer, crumbled', 'Dairy & eggs'), i(1, '', 'onion, chopped', 'Produce'), i(1, '', 'tomato, chopped', 'Produce'), i(1, '', 'green chilli', 'Produce'), i(1, 'tsp', 'ginger-garlic paste', 'Pantry'), i(0.5, 'tsp', 'garam masala', 'Spices'), i(0.25, 'tsp', 'turmeric', 'Spices'), i(1, 'tbsp', 'ghee', 'Pantry')],
    steps: ['Heat the ghee and fry the onion until soft, about 4 minutes.', 'Add the ginger-garlic paste and chilli and cook 1 minute.', 'Add the tomato, turmeric and salt and cook until soft.', 'Stir in the paneer and garam masala and cook 3 minutes.', 'Finish with coriander.'],
    video: 'paneer bhurji recipe', hue: 20,
  },
  {
    id: 'chicken-caesar', title: 'Grilled chicken Caesar, no croutons', summary: 'Crisp romaine, juicy chicken and a quick creamy dressing.',
    meals: ['lunch', 'dinner'], tags: ['keto', 'lowcarb', 'highprotein', 'diabetic'], minutes: 20, servings: 2,
    kcal: 520, protein: 42, carbs: 5, fat: 36, fiber: 3,
    ingredients: [i(300, 'g', 'chicken breast', 'Meat & fish'), i(1, 'head', 'romaine lettuce', 'Produce'), i(30, 'g', 'parmesan', 'Dairy & eggs'), i(3, 'tbsp', 'mayonnaise', 'Pantry'), i(1, 'tsp', 'Dijon mustard', 'Pantry'), i(0.5, '', 'lemon', 'Produce'), i(1, 'clove', 'garlic, grated', 'Produce'), i(1, 'tbsp', 'olive oil', 'Pantry')],
    steps: ['Rub the chicken with olive oil, salt and pepper.', 'Grill or pan-fry 5 to 6 minutes per side until cooked through, then rest and slice.', 'Whisk the mayonnaise, mustard, garlic, lemon juice and half the parmesan.', 'Toss the lettuce with the dressing.', 'Top with chicken and the rest of the parmesan.'],
    video: 'low carb chicken caesar salad', hue: 95,
  },
  {
    id: 'tuna-avocado', title: 'Tuna avocado salad', summary: 'No cooking. Ready in five minutes and keeps you full for hours.',
    meals: ['lunch'], tags: ['keto', 'lowcarb', 'highprotein', 'quick', 'diabetic'], minutes: 5, servings: 2,
    kcal: 410, protein: 32, carbs: 6, fat: 28, fiber: 7,
    ingredients: [i(2, 'cans', 'tuna in water, drained', 'Pantry'), i(1, '', 'avocado', 'Produce'), i(1, '', 'cucumber', 'Produce'), i(0.25, '', 'red onion', 'Produce'), i(1, '', 'lemon', 'Produce'), i(1, 'tbsp', 'olive oil', 'Pantry')],
    steps: ['Dice the avocado, cucumber and onion.', 'Flake the tuna into a bowl.', 'Add the vegetables, lemon juice, olive oil, salt and pepper.', 'Toss gently and serve.'],
    video: 'tuna avocado salad recipe', hue: 140,
  },
  {
    id: 'tikka-cauli-bowl', title: 'Chicken tikka cauliflower-rice bowl', summary: 'Yogurt-marinated chicken over spiced cauliflower rice with raita.',
    meals: ['lunch', 'dinner'], tags: ['desi', 'lowcarb', 'highprotein', 'diabetic'], minutes: 30, servings: 2,
    kcal: 450, protein: 45, carbs: 12, fat: 24, fiber: 5,
    ingredients: [i(350, 'g', 'boneless chicken thigh or breast', 'Meat & fish'), i(100, 'g', 'plain yogurt', 'Dairy & eggs'), i(2, 'tbsp', 'tikka masala spice mix', 'Spices'), i(400, 'g', 'cauliflower rice', 'Frozen'), i(0.5, 'tsp', 'cumin seeds', 'Spices'), i(1, '', 'cucumber', 'Produce'), i(1, 'tbsp', 'oil', 'Pantry')],
    steps: ['Mix the chicken with half the yogurt, the spice mix and salt; rest 15 minutes.', 'Cook the chicken in a hot pan or under a grill until charred and cooked through.', 'Fry the cumin seeds in oil, add the cauliflower rice and cook 5 minutes.', 'Grate the cucumber into the remaining yogurt for raita.', 'Serve the chicken over the rice with raita.'],
    video: 'chicken tikka in pan recipe', hue: 12,
  },
  {
    id: 'daal-quinoa', title: 'Masoor daal with quinoa', summary: 'Red lentils with a sizzling garlic tadka. Comforting and full of fibre.',
    meals: ['lunch', 'dinner'], tags: ['desi', 'vegetarian', 'balanced', 'diabetic'], minutes: 35, servings: 4,
    kcal: 430, protein: 21, carbs: 62, fat: 9, fiber: 13,
    ingredients: [i(250, 'g', 'red lentils (masoor)', 'Pantry'), i(180, 'g', 'quinoa', 'Pantry'), i(1, '', 'onion', 'Produce'), i(2, '', 'tomatoes', 'Produce'), i(4, 'cloves', 'garlic', 'Produce'), i(1, 'tsp', 'cumin seeds', 'Spices'), i(0.5, 'tsp', 'turmeric', 'Spices'), i(2, 'tbsp', 'ghee or oil', 'Pantry')],
    steps: ['Rinse the lentils and simmer with 900 ml water, turmeric and salt for 20 minutes.', 'Cook the quinoa in 360 ml water for 15 minutes.', 'Fry the onion until golden, add the tomatoes and cook down, then stir into the daal.', 'For the tadka, heat the ghee and fry the cumin and sliced garlic until golden.', 'Pour the tadka over the daal and serve with quinoa.'],
    video: 'masoor daal tadka recipe', hue: 42,
  },
  {
    id: 'halloumi-salad', title: 'Halloumi and roasted vegetable salad', summary: 'Golden halloumi with roasted peppers, zucchini and a lemon dressing.',
    meals: ['lunch', 'dinner'], tags: ['vegetarian', 'lowcarb', 'keto'], minutes: 30, servings: 2,
    kcal: 480, protein: 22, carbs: 10, fat: 39, fiber: 4,
    ingredients: [i(225, 'g', 'halloumi', 'Dairy & eggs'), i(1, '', 'red pepper', 'Produce'), i(1, '', 'zucchini', 'Produce'), i(60, 'g', 'rocket', 'Produce'), i(3, 'tbsp', 'olive oil', 'Pantry'), i(1, '', 'lemon', 'Produce'), i(1, 'tsp', 'dried oregano', 'Spices')],
    steps: ['Heat the oven to 220 °C.', 'Toss the sliced pepper and zucchini with 1 tbsp oil and oregano; roast 20 minutes.', 'Slice the halloumi and fry in a dry pan for 2 minutes per side.', 'Whisk the remaining oil with lemon juice.', 'Combine the rocket, vegetables and halloumi, and dress.'],
    video: 'halloumi roasted vegetable salad', hue: 60,
  },
  {
    id: 'chickpea-feta', title: 'Chickpea, cucumber and feta salad', summary: 'A crunchy, protein-rich salad for packed lunches.',
    meals: ['lunch'], tags: ['vegetarian', 'balanced', 'quick'], minutes: 10, servings: 2,
    kcal: 390, protein: 15, carbs: 38, fat: 20, fiber: 10,
    ingredients: [i(1, 'can', 'chickpeas, drained', 'Pantry'), i(1, '', 'cucumber', 'Produce'), i(150, 'g', 'cherry tomatoes', 'Produce'), i(80, 'g', 'feta', 'Dairy & eggs'), i(0.25, '', 'red onion', 'Produce'), i(2, 'tbsp', 'olive oil', 'Pantry'), i(1, 'tbsp', 'lemon juice', 'Produce')],
    steps: ['Chop the cucumber, tomatoes and onion.', 'Add the chickpeas and crumble in the feta.', 'Dress with olive oil, lemon, salt and pepper.'],
    video: 'chickpea feta salad meal prep', hue: 170,
  },
  {
    id: 'salmon-greens', title: 'Pan-seared salmon with garlic butter greens', summary: 'Crispy-skinned salmon with spinach and green beans in garlic butter.',
    meals: ['dinner', 'lunch'], tags: ['keto', 'lowcarb', 'highprotein', 'quick', 'diabetic'], minutes: 20, servings: 2,
    kcal: 560, protein: 38, carbs: 6, fat: 42, fiber: 4,
    ingredients: [i(2, 'fillets', 'salmon (about 300 g)', 'Meat & fish'), i(200, 'g', 'green beans', 'Produce'), i(100, 'g', 'spinach', 'Produce'), i(2, 'tbsp', 'butter', 'Dairy & eggs'), i(2, 'cloves', 'garlic', 'Produce'), i(1, 'tbsp', 'olive oil', 'Pantry'), i(0.5, '', 'lemon', 'Produce')],
    steps: ['Pat the salmon dry and season.', 'Cook skin-side down in hot oil for 5 minutes, then flip for 2 minutes.', 'In another pan melt the butter with sliced garlic.', 'Add the beans and cook 4 minutes, then wilt in the spinach.', 'Serve the salmon on the greens with lemon.'],
    tip: 'Do not move the salmon for the first 4 minutes and the skin will release by itself.',
    video: 'crispy skin salmon pan seared', hue: 8,
  },
  {
    id: 'light-karahi', title: 'Lighter chicken karahi', summary: 'All the flavour of a classic karahi with less oil and no cream.',
    meals: ['dinner', 'lunch'], tags: ['desi', 'keto', 'lowcarb', 'highprotein'], minutes: 40, servings: 4,
    kcal: 410, protein: 38, carbs: 9, fat: 24, fiber: 2,
    ingredients: [i(800, 'g', 'chicken, curry cut', 'Meat & fish'), i(5, '', 'tomatoes', 'Produce'), i(1, 'tbsp', 'ginger, julienned', 'Produce'), i(1, 'tbsp', 'garlic paste', 'Produce'), i(4, '', 'green chillies', 'Produce'), i(1, 'tsp', 'crushed black pepper', 'Spices'), i(1, 'tsp', 'cumin, roasted and crushed', 'Spices'), i(3, 'tbsp', 'oil', 'Pantry'), i(100, 'g', 'plain yogurt', 'Dairy & eggs')],
    steps: ['Heat the oil in a karahi or wok and brown the chicken on high heat, about 6 minutes.', 'Add the garlic and cook 1 minute.', 'Add chopped tomatoes and salt; cover and cook 15 minutes until soft.', 'Uncover, stir in the yogurt, pepper and cumin, and cook on high until the oil separates.', 'Finish with ginger, green chillies and coriander.'],
    video: 'chicken karahi recipe', hue: 2,
  },
  {
    id: 'zucchini-lasagna', title: 'Zucchini beef lasagna', summary: 'Layers of zucchini, rich beef ragù and melted mozzarella.',
    meals: ['dinner'], tags: ['keto', 'lowcarb', 'highprotein'], minutes: 60, servings: 4,
    kcal: 590, protein: 40, carbs: 10, fat: 43, fiber: 3,
    ingredients: [i(500, 'g', 'minced beef', 'Meat & fish'), i(3, '', 'zucchini', 'Produce'), i(400, 'g', 'crushed tomatoes', 'Pantry'), i(250, 'g', 'ricotta', 'Dairy & eggs'), i(150, 'g', 'mozzarella, grated', 'Dairy & eggs'), i(2, 'cloves', 'garlic', 'Produce'), i(1, 'tsp', 'dried basil', 'Spices')],
    steps: ['Slice the zucchini lengthways, salt and leave 10 minutes, then pat dry.', 'Brown the beef with garlic, add tomatoes and basil, and simmer 15 minutes.', 'Heat the oven to 190 °C.', 'Layer zucchini, sauce and ricotta in a dish, three times, finishing with mozzarella.', 'Bake 30 minutes and rest 10 minutes before cutting.'],
    video: 'zucchini lasagna recipe keto', hue: 110,
  },
  {
    id: 'palak-paneer', title: 'Palak paneer', summary: 'Smooth spiced spinach sauce with soft cubes of paneer.',
    meals: ['dinner', 'lunch'], tags: ['desi', 'vegetarian', 'keto', 'lowcarb'], minutes: 35, servings: 3,
    kcal: 420, protein: 20, carbs: 10, fat: 33, fiber: 4,
    ingredients: [i(400, 'g', 'spinach', 'Produce'), i(250, 'g', 'paneer, cubed', 'Dairy & eggs'), i(1, '', 'onion', 'Produce'), i(1, '', 'tomato', 'Produce'), i(1, 'tbsp', 'ginger-garlic paste', 'Pantry'), i(1, 'tsp', 'garam masala', 'Spices'), i(2, 'tbsp', 'cream', 'Dairy & eggs'), i(1, 'tbsp', 'ghee', 'Pantry')],
    steps: ['Blanch the spinach for 2 minutes, cool in cold water and blend smooth.', 'Fry the onion in ghee until golden, add ginger-garlic and tomato and cook down.', 'Stir in the spinach purée and garam masala and simmer 5 minutes.', 'Add the paneer and cream and heat through.'],
    video: 'palak paneer recipe', hue: 125,
  },
  {
    id: 'lemon-chicken-traybake', title: 'Lemon herb chicken tray bake', summary: 'One tray, ten minutes of prep, enough for tomorrow too.',
    meals: ['dinner', 'lunch'], tags: ['lowcarb', 'highprotein', 'balanced', 'diabetic'], minutes: 45, servings: 4,
    kcal: 480, protein: 44, carbs: 14, fat: 26, fiber: 5,
    ingredients: [i(800, 'g', 'chicken thighs, skinless', 'Meat & fish'), i(1, 'head', 'broccoli', 'Produce'), i(2, '', 'red onions', 'Produce'), i(250, 'g', 'cherry tomatoes', 'Produce'), i(2, '', 'lemons', 'Produce'), i(3, 'tbsp', 'olive oil', 'Pantry'), i(2, 'tsp', 'mixed dried herbs', 'Spices')],
    steps: ['Heat the oven to 200 °C.', 'Toss the chicken with oil, lemon zest and juice, herbs and salt.', 'Spread on a tray with the onion wedges and roast 20 minutes.', 'Add the broccoli and tomatoes and roast 15 minutes more.'],
    video: 'lemon herb chicken traybake', hue: 55,
  },
  {
    id: 'tofu-stirfry', title: 'Tofu and vegetable stir-fry', summary: 'Crispy tofu, crunchy vegetables and a ginger-soy glaze.',
    meals: ['dinner', 'lunch'], tags: ['vegetarian', 'lowcarb', 'highprotein', 'quick'], minutes: 20, servings: 2,
    kcal: 380, protein: 24, carbs: 14, fat: 25, fiber: 5,
    ingredients: [i(300, 'g', 'firm tofu', 'Produce'), i(1, '', 'red pepper', 'Produce'), i(150, 'g', 'broccoli florets', 'Produce'), i(100, 'g', 'mushrooms', 'Produce'), i(2, 'tbsp', 'soy sauce', 'Pantry'), i(1, 'tbsp', 'ginger, grated', 'Produce'), i(1, 'tbsp', 'sesame oil', 'Pantry')],
    steps: ['Press the tofu, cut into cubes and pan-fry until golden on all sides.', 'Remove the tofu and stir-fry the vegetables on high heat for 4 minutes.', 'Add the ginger and soy sauce and return the tofu.', 'Toss for 1 minute and serve.'],
    video: 'crispy tofu stir fry', hue: 75,
  },
  {
    id: 'coconut-fish-curry', title: 'Coconut fish curry', summary: 'Mild, fragrant curry with tender white fish in coconut milk.',
    meals: ['dinner'], tags: ['desi', 'keto', 'lowcarb', 'highprotein'], minutes: 30, servings: 4,
    kcal: 430, protein: 34, carbs: 7, fat: 29, fiber: 2,
    ingredients: [i(700, 'g', 'firm white fish', 'Meat & fish'), i(400, 'ml', 'coconut milk', 'Pantry'), i(1, '', 'onion', 'Produce'), i(2, '', 'tomatoes', 'Produce'), i(10, '', 'curry leaves', 'Produce'), i(1, 'tsp', 'mustard seeds', 'Spices'), i(1, 'tsp', 'chilli powder', 'Spices'), i(2, 'tbsp', 'coconut oil', 'Pantry')],
    steps: ['Fry the mustard seeds and curry leaves in coconut oil until they pop.', 'Add the onion and cook until soft, then the tomatoes and chilli powder.', 'Pour in the coconut milk and simmer 5 minutes.', 'Add the fish pieces and simmer gently 6 to 8 minutes without stirring hard.'],
    video: 'kerala coconut fish curry', hue: 36,
  },
  {
    id: 'chicken-rice-bowl', title: 'Chicken, brown rice and broccoli bowl', summary: 'The classic training-day bowl, with a quick soy-lime dressing.',
    meals: ['lunch', 'dinner'], tags: ['balanced', 'highprotein', 'diabetic'], minutes: 30, servings: 2,
    kcal: 540, protein: 45, carbs: 55, fat: 14, fiber: 6,
    ingredients: [i(300, 'g', 'chicken breast', 'Meat & fish'), i(150, 'g', 'brown rice', 'Pantry'), i(1, 'head', 'broccoli', 'Produce'), i(1, 'tbsp', 'soy sauce', 'Pantry'), i(1, '', 'lime', 'Produce'), i(1, 'tbsp', 'olive oil', 'Pantry')],
    steps: ['Cook the rice according to the packet.', 'Season and cook the chicken in a hot pan, 5 to 6 minutes per side, then slice.', 'Steam the broccoli for 4 minutes.', 'Mix the soy sauce, lime juice and oil.', 'Build bowls and drizzle with dressing.'],
    video: 'chicken rice broccoli meal prep', hue: 150,
  },
  {
    id: 'rajma-rice', title: 'Rajma with brown rice', summary: 'Slow-simmered kidney beans in an onion-tomato masala.',
    meals: ['lunch', 'dinner'], tags: ['desi', 'vegetarian', 'balanced'], minutes: 45, servings: 4,
    kcal: 450, protein: 17, carbs: 70, fat: 10, fiber: 14,
    ingredients: [i(2, 'cans', 'kidney beans, drained', 'Pantry'), i(200, 'g', 'brown rice', 'Pantry'), i(2, '', 'onions', 'Produce'), i(3, '', 'tomatoes', 'Produce'), i(1, 'tbsp', 'ginger-garlic paste', 'Pantry'), i(1, 'tbsp', 'rajma masala or garam masala', 'Spices'), i(2, 'tbsp', 'oil', 'Pantry')],
    steps: ['Cook the rice.', 'Fry the onions until deep golden, then add ginger-garlic and the masala.', 'Add puréed tomatoes and cook until the oil separates.', 'Add the beans and 300 ml water and simmer 20 minutes, mashing a few beans to thicken.', 'Serve over rice.'],
    video: 'rajma masala recipe', hue: 0,
  },
  {
    id: 'cocoa-almond-bites', title: 'Cocoa almond energy bites', summary: 'No-bake bites for a sweet craving without the sugar crash.',
    meals: ['snack'], tags: ['keto', 'lowcarb', 'vegetarian'], minutes: 15, servings: 6,
    kcal: 190, protein: 5, carbs: 4, fat: 17, fiber: 3,
    ingredients: [i(120, 'g', 'almond butter', 'Pantry'), i(40, 'g', 'desiccated coconut', 'Pantry'), i(2, 'tbsp', 'cocoa powder', 'Pantry'), i(2, 'tbsp', 'coconut oil, melted', 'Pantry'), i(1, 'tsp', 'vanilla extract', 'Pantry')],
    steps: ['Mix everything in a bowl until it forms a thick dough.', 'Roll into 12 balls.', 'Chill for 30 minutes. Keeps 1 week in the fridge.'],
    video: 'no bake almond butter energy balls', hue: 25,
  },
  {
    id: 'cucumber-hummus', title: 'Cucumber boats with hummus', summary: 'Cool, crunchy and ready in two minutes.',
    meals: ['snack'], tags: ['vegetarian', 'lowcarb', 'quick', 'diabetic'], minutes: 3, servings: 1,
    kcal: 140, protein: 5, carbs: 10, fat: 9, fiber: 4,
    ingredients: [i(1, '', 'cucumber', 'Produce'), i(3, 'tbsp', 'hummus', 'Pantry'), i(null, '', 'paprika and sesame seeds', 'Spices')],
    steps: ['Halve the cucumber lengthways and scoop out the seeds.', 'Fill with hummus and sprinkle with paprika and sesame.'],
    video: 'healthy cucumber snack ideas', hue: 160,
  },
  {
    id: 'egg-chaat', title: 'Egg chaat', summary: 'Boiled eggs with chaat masala, onion and lemon.',
    meals: ['snack', 'breakfast'], tags: ['desi', 'keto', 'lowcarb', 'highprotein', 'quick', 'vegetarian', 'diabetic'], minutes: 12, servings: 1,
    kcal: 180, protein: 13, carbs: 3, fat: 13, fiber: 1,
    ingredients: [i(2, '', 'eggs', 'Dairy & eggs'), i(0.25, '', 'red onion', 'Produce'), i(0.5, 'tsp', 'chaat masala', 'Spices'), i(0.5, '', 'lemon', 'Produce'), i(1, 'tbsp', 'chopped coriander', 'Produce')],
    steps: ['Boil the eggs for 9 minutes, cool and peel.', 'Halve the eggs and top with onion and coriander.', 'Sprinkle with chaat masala and lemon juice.'],
    video: 'egg chaat recipe', hue: 45,
  },
  {
    id: 'roasted-chana', title: 'Spiced roasted chickpeas', summary: 'A crunchy, fibre-rich alternative to crisps.',
    meals: ['snack'], tags: ['vegetarian', 'balanced', 'desi'], minutes: 35, servings: 4,
    kcal: 160, protein: 8, carbs: 22, fat: 5, fiber: 6,
    ingredients: [i(2, 'cans', 'chickpeas, drained and dried', 'Pantry'), i(1, 'tbsp', 'olive oil', 'Pantry'), i(1, 'tsp', 'chaat masala or paprika', 'Spices'), i(0.5, 'tsp', 'cumin', 'Spices')],
    steps: ['Heat the oven to 200 °C.', 'Toss the dried chickpeas with oil and spices.', 'Roast 30 minutes, shaking halfway, until crunchy.'],
    video: 'crispy roasted chickpeas oven', hue: 32,
  },
  {
    id: 'parmesan-crisps', title: 'Parmesan crisps', summary: 'One ingredient, ten minutes, zero carbs to speak of.',
    meals: ['snack'], tags: ['keto', 'lowcarb', 'vegetarian', 'quick'], minutes: 10, servings: 2,
    kcal: 170, protein: 14, carbs: 1, fat: 12, fiber: 0,
    ingredients: [i(80, 'g', 'parmesan, finely grated', 'Dairy & eggs'), i(null, '', 'black pepper or chilli flakes', 'Spices')],
    steps: ['Heat the oven to 200 °C and line a tray.', 'Place tablespoon mounds of cheese on the tray and flatten slightly.', 'Bake 5 to 6 minutes until golden, then cool to crisp.'],
    video: 'parmesan crisps recipe', hue: 52,
  },
  {
    id: 'berry-protein-smoothie', title: 'Berry protein smoothie', summary: 'Thick, cold and 30 g of protein after a workout.',
    meals: ['snack', 'breakfast'], tags: ['highprotein', 'balanced', 'vegetarian', 'quick'], minutes: 3, servings: 1,
    kcal: 290, protein: 30, carbs: 30, fat: 5, fiber: 6,
    ingredients: [i(1, 'scoop', 'whey or plant protein', 'Pantry'), i(120, 'g', 'frozen mixed berries', 'Frozen'), i(200, 'ml', 'milk', 'Dairy & eggs'), i(1, 'tbsp', 'ground flaxseed', 'Pantry')],
    steps: ['Blend everything until smooth.', 'Add a splash of water if too thick.'],
    video: 'berry protein smoothie', hue: 300,
  },
];

export const RECIPE_BY_ID: Record<string, Recipe> = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
