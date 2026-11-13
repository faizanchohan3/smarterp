# Nourish: Keto & Diet Plan (Android / iOS)

A React Native (Expo SDK 58) diet coach app, ready to build for Google Play.

## Features

| Tab | What it does |
|---|---|
| **Today** | Calorie ring, protein / net carbs / fat bars, water glasses, food diary by meal, exercise. Ticking a planned meal logs it automatically. |
| **Meal plan** | A 7-day plan in the person's eating style (keto, low carb, high protein, vegetarian, desi, balanced), portions scaled to their calorie target. Swap any meal, change servings, mark as eaten, shuffle a new week. |
| **Recipes** | 27 original recipes with search, filters and favourites. Each has scalable ingredients, steps, nutrition per serving, a **cook mode** that keeps the screen on, and a "watch how it's made" video link. |
| **Fasting** | 13:11, 16:8, 18:6, 20:4, OMAD and 36 h timers with fasting stages and history. |
| **Me** | Profile and targets, progress (weight chart, BMI, 7-day calories), shopping list, guided workouts with timer, guides and videos, appearance, account. |

Plus: an automatic **shopping list** built from the meal plan (sorted by aisle, shareable), a food library of 70+ foods including Pakistani and Indian dishes, your own custom foods, light and dark mode.

**Login is optional.** People can use the app as a guest (everything saved on the phone) or sign in with email and password to sync between devices. Sign-in uses Supabase; if you build without Supabase settings, the app runs guest-only.

## Run it on your phone

```bash
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app on Android.

## Turn on login and sync (optional)

1. Create a project at supabase.com (it can be the same one SmartERP uses, or a new one).
2. In the Supabase SQL editor, run `supabase/nourish_state.sql`. It creates one table with row-level security, so each person can read only their own data.
3. Copy `.env.example` to `.env.local` and fill in the project URL and the **publishable (anon) key**. Never put the service-role key in the app.
4. For store builds, add the same two variables in your Expo project's environment variables (`npx eas-cli@latest env:create`) so the cloud build gets them.

## Publish to Google Play

You need a Google Play Developer account (one-time $25 fee) and a free Expo account.

1. `npx eas-cli@latest login`, then `npx eas-cli@latest init` to link the project.
2. Change the package name in `app.json` (`android.package`, now `com.nourish.dietcoach`) to one you own. **It can never change after the first upload.**
3. Build the release bundle: `npm run build:android`. Expo builds and signs an `.aab` in the cloud and manages your upload key.
4. In Play Console, create the app, then either upload the `.aab` by hand to **Internal testing**, or set up a Google service account key in the Expo dashboard and run `npm run submit:android`.
5. Fill in the store listing. Use `assets/play-store-icon-512.png` as the hi-res icon. You also need a 1024×500 feature graphic and at least 2 phone screenshots.
6. Complete **App content**: privacy policy URL (required, because the app stores health data and email addresses), data safety form (email, health and fitness info; stored on Supabase if sign-in is on), target audience 18+, and the health app declaration.
7. If your developer account is a personal one created after November 2023, Google requires a closed test with at least 12 testers for 14 days before you can release to production.
8. To test before the store, `npx eas-cli@latest build -p android --profile preview` gives an installable `.apk`.

## Selling VIP (not built yet)

All features are free and unlocked in this version. There is no payment code. To charge for VIP on Google Play you must use **Google Play Billing**; Google does not allow other payment methods for digital features. The usual route in Expo is RevenueCat (`react-native-purchases`): see https://docs.expo.dev/guides/in-app-purchases/. The screen to put a paywall on is `src/app/vip.tsx`.

## Project layout

```
src/app/            screens (Expo Router: every file is a route)
  (tabs)/           Today, Meal plan, Recipes, Fasting, Me
  recipe/[id]       recipe detail     cook/[id]     step-by-step cook mode
  workout/[id]      workout timer     add-food      food and recipe search
  shopping, progress, workouts, guides, vip, welcome, auth, onboarding
src/data/           foods, recipes, diets, fasting, workouts, guides
src/lib/core.ts     calorie maths, meal-plan generator, shopping list
src/store/app.tsx   app state, saved on the device and synced to Supabase
src/components/ui   shared UI pieces
supabase/           SQL for the sync table
```

## Checks

```bash
npm run typecheck
npm run lint
```

Nutrition values are typical estimates. The app gives general guidance, not medical advice, and says so on the onboarding, plan and fasting screens.
