import type { Tag } from './recipes';

export type DietId = 'keto' | 'lowcarb' | 'highprotein' | 'vegetarian' | 'desi' | 'balanced';

export type Diet = {
  id: DietId;
  name: string;
  blurb: string;
  /** Protein, carbs, fat as % of calories. */
  split: [number, number, number];
  /** A recipe qualifies if it has any of these tags. */
  tags: Tag[];
  /** And none of these. */
  exclude?: Tag[];
};

export const DIETS: Diet[] = [
  { id: 'keto', name: 'Keto', blurb: 'Under 20–30 g net carbs a day. Fat for fuel.', split: [25, 5, 70], tags: ['keto'] },
  { id: 'lowcarb', name: 'Low carb', blurb: 'Moderate carbs, no sugar, lots of vegetables.', split: [30, 20, 50], tags: ['keto', 'lowcarb'] },
  { id: 'highprotein', name: 'High protein', blurb: 'Stay full and protect muscle while you lose fat.', split: [35, 35, 30], tags: ['highprotein'] },
  { id: 'vegetarian', name: 'Vegetarian', blurb: 'Eggs, dairy, legumes and vegetables. No meat or fish.', split: [20, 45, 35], tags: ['vegetarian'] },
  { id: 'desi', name: 'Desi healthy', blurb: 'Home-style Pakistani and Indian food, lighter.', split: [25, 40, 35], tags: ['desi'] },
  { id: 'balanced', name: 'Balanced', blurb: 'A bit of everything, portioned to your goal.', split: [25, 45, 30], tags: ['balanced', 'highprotein', 'lowcarb', 'keto', 'vegetarian', 'desi'] },
];
export const DIET_BY_ID = Object.fromEntries(DIETS.map((d) => [d.id, d])) as Record<DietId, Diet>;

export type FastProtocol = { id: string; name: string; hours: number; note: string };
export const FAST_PROTOCOLS: FastProtocol[] = [
  { id: '13', name: 'Circadian 13:11', hours: 13, note: 'A gentle start: finish dinner early, eat breakfast as usual.' },
  { id: '16', name: '16:8', hours: 16, note: 'The most popular schedule. Skip breakfast, eat within 8 hours.' },
  { id: '18', name: '18:6', hours: 18, note: 'A longer daily fast with a 6-hour eating window.' },
  { id: '20', name: '20:4', hours: 20, note: 'Two meals in a 4-hour window.' },
  { id: '24', name: 'OMAD 23:1', hours: 23, note: 'One meal a day. For experienced fasters.' },
  { id: '36', name: '36 hours', hours: 36, note: 'Extended fast. Speak to a doctor first if you take medication.' },
];

/** Educational milestones; timings vary a lot between people. */
export const FAST_STAGES: { h: number; title: string; body: string }[] = [
  { h: 0, title: 'Fed', body: 'Your body is digesting and using energy from your last meal.' },
  { h: 4, title: 'Blood sugar settles', body: 'Insulin falls as your meal is absorbed.' },
  { h: 12, title: 'Fat burning picks up', body: 'Stored glycogen runs lower and your body uses more fat.' },
  { h: 16, title: 'Mild ketosis for many', body: 'Ketone levels often begin to rise, especially on low-carb diets.' },
  { h: 24, title: 'Deeper fast', body: 'Drink water and keep electrolytes up. Stop if you feel unwell.' },
];

export type Workout = {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All levels';
  met: number;
  work?: number;
  rest?: number;
  rounds?: number;
  steadyMinutes?: number;
  moves: string[];
  video: string;
};

export const WORKOUTS: Workout[] = [
  { id: 'hiit', name: 'Fat-burn HIIT', level: 'Intermediate', met: 8, work: 40, rest: 20, rounds: 2, moves: ['Jumping jacks', 'High knees', 'Bodyweight squats', 'Mountain climbers', 'Burpees', 'Plank hold'], video: '20 minute fat burning HIIT workout no equipment' },
  { id: 'strength', name: 'Full-body strength', level: 'All levels', met: 5, work: 45, rest: 15, rounds: 3, moves: ['Push-ups', 'Squats', 'Reverse lunges', 'Glute bridges', 'Superman hold', 'Plank'], video: 'full body bodyweight strength workout at home' },
  { id: 'walk', name: 'Brisk walk', level: 'Beginner', met: 4.3, steadyMinutes: 30, moves: ['Brisk walk at a pace where talking is slightly hard'], video: 'indoor walking workout 30 minutes' },
  { id: 'yoga', name: 'Morning yoga flow', level: 'Beginner', met: 2.5, work: 60, rest: 0, rounds: 1, moves: ['Mountain pose', 'Forward fold', 'Downward dog', 'Cobra', "Child's pose", 'Warrior I', 'Warrior II', 'Seated twist'], video: '20 minute morning yoga flow beginners' },
  { id: 'core', name: 'Core blast', level: 'Intermediate', met: 4, work: 40, rest: 20, rounds: 2, moves: ['Crunches', 'Bicycle crunches', 'Leg raises', 'Russian twists', 'Plank', 'Dead bug'], video: '12 minute core abs workout' },
  { id: 'rope', name: 'Skipping rope', level: 'Advanced', met: 11, work: 60, rest: 30, rounds: 5, moves: ['Skip, basic bounce', 'Skip, alternate feet'], video: 'jump rope workout for beginners' },
  { id: 'lowimpact', name: 'Low-impact cardio', level: 'Beginner', met: 4, work: 50, rest: 10, rounds: 3, moves: ['March in place', 'Step touch', 'Standing knee lifts', 'Side steps with arm raises', 'Heel digs'], video: 'low impact cardio workout apartment friendly' },
  { id: 'stretch', name: 'Stretch and mobility', level: 'All levels', met: 2.3, work: 45, rest: 0, rounds: 1, moves: ['Neck rolls', 'Shoulder circles', 'Hip circles', 'Hamstring stretch', 'Quad stretch', 'Cat-cow', 'Butterfly stretch'], video: 'full body stretching routine 10 minutes' },
];
export const WORKOUT_BY_ID = Object.fromEntries(WORKOUTS.map((w) => [w.id, w])) as Record<string, Workout>;

export function workoutMinutes(w: Workout): number {
  if (w.steadyMinutes) return w.steadyMinutes;
  return Math.round((w.moves.length * (w.rounds ?? 1) * ((w.work ?? 0) + (w.rest ?? 0))) / 60);
}

export type Guide = { id: string; title: string; minutes: number; video: string; sections: { h: string; items: string[] }[] };

export const GUIDES: Guide[] = [
  {
    id: 'keto-foods', title: 'Keto food list: what to eat', minutes: 4, video: 'keto diet for beginners explained',
    sections: [
      { h: 'Eat freely', items: ['Eggs, meat, chicken and fish', 'Leafy greens, cauliflower, broccoli, zucchini, cucumber', 'Paneer, cheese, Greek yogurt, butter, ghee', 'Olive oil, avocado, nuts and seeds'] },
      { h: 'Eat in small amounts', items: ['Berries', 'Onion and tomato for cooking', 'Dark chocolate 70% or more'] },
      { h: 'Avoid', items: ['Sugar, sweets, soft drinks and juice', 'Rice, roti, naan, bread and pasta', 'Potatoes and most fruit', 'Beer and sweet drinks'] },
    ],
  },
  {
    id: 'plate', title: 'Build a balanced plate', minutes: 3, video: 'healthy plate method portion control',
    sections: [
      { h: 'Half the plate', items: ['Non-starchy vegetables or salad'] },
      { h: 'A quarter of the plate', items: ['Protein: chicken, fish, eggs, daal, paneer, tofu'] },
      { h: 'A quarter of the plate', items: ['Slow carbs: brown rice, roti, quinoa, sweet potato, beans'] },
      { h: 'Add', items: ['A thumb of healthy fat', 'Water instead of sweet drinks'] },
    ],
  },
  {
    id: 'fasting-start', title: 'Intermittent fasting: getting started', minutes: 5, video: 'intermittent fasting for beginners 16 8',
    sections: [
      { h: 'During the fast', items: ['Water, black coffee and plain tea are fine', 'Add a pinch of salt to water if you feel light-headed', 'Stay busy in the first hour you would normally eat'] },
      { h: 'Breaking the fast', items: ['Start with protein and vegetables', 'Avoid a huge sugary meal'] },
      { h: 'Who should not fast without medical advice', items: ['Pregnant or breastfeeding women', 'People taking insulin or blood-pressure medicine', 'Anyone with a history of eating disorders', 'Children and teenagers'] },
    ],
  },
  {
    id: 'desi-swaps', title: 'Smart desi swaps', minutes: 3, video: 'healthy pakistani indian food swaps weight loss',
    sections: [
      { h: 'Swap', items: ['Paratha → roti with no ghee', 'White rice → cauliflower rice or half portion brown rice', 'Sweet lassi → salted lassi or chaach', 'Fried pakora → roasted chana', 'Chai with sugar → chai with less sugar or none'] },
      { h: 'Cooking tips', items: ['Measure oil with a spoon instead of pouring', 'Use yogurt instead of cream in curries', 'Grill tikka instead of frying'] },
    ],
  },
];
