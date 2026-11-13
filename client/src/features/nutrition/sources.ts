/**
 * Where the Nutrition section's numbers and defaults come from (App Store guideline 1.4.1
 * asks for citations next to health information). Titles and citations stay in their
 * original language; `calories.sources.topics.<id>` says, per locale, what each one backs.
 * Keep in sync with mobile/src/features/nutrition/sources.ts.
 */
export type NutritionSourceId =
  | 'bmr'
  | 'activity'
  | 'bmi'
  | 'deficit'
  | 'dailyCalories'
  | 'water'
  | 'activityGuidelines'
  | 'steps';

export type NutritionSource = {
  id: NutritionSourceId;
  title: string;
  citation: string;
  url: string;
};

export const nutritionSources: NutritionSource[] = [
  {
    id: 'bmr',
    title: 'A new predictive equation for resting energy expenditure in healthy individuals',
    citation: 'Mifflin MD, St Jeor ST, Hill LA, et al. Am J Clin Nutr. 1990;51(2):241–247',
    url: 'https://doi.org/10.1093/ajcn/51.2.241',
  },
  {
    id: 'activity',
    title: 'Human energy requirements: Report of a Joint FAO/WHO/UNU Expert Consultation',
    citation: 'FAO, WHO, UNU. Rome, 2004',
    url: 'https://www.fao.org/4/y5686e/y5686e00.htm',
  },
  {
    id: 'bmi',
    title: 'Obesity and overweight (fact sheet)',
    citation: 'World Health Organization',
    url: 'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight',
  },
  {
    id: 'deficit',
    title: 'Clinical Guidelines on the Identification, Evaluation, and Treatment of Overweight and Obesity in Adults',
    citation: 'National Heart, Lung, and Blood Institute (NIH), 1998',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK2003/',
  },
  {
    id: 'dailyCalories',
    title: 'Understanding calories',
    citation: 'NHS (UK National Health Service)',
    url: 'https://www.nhs.uk/live-well/healthy-weight/managing-your-weight/understanding-calories/',
  },
  {
    id: 'water',
    title: 'Scientific Opinion on Dietary Reference Values for water',
    citation: 'EFSA Panel on Dietetic Products, Nutrition and Allergies. EFSA Journal. 2010;8(3):1459',
    url: 'https://doi.org/10.2903/j.efsa.2010.1459',
  },
  {
    id: 'activityGuidelines',
    title: 'WHO guidelines on physical activity and sedentary behaviour',
    citation: 'World Health Organization, 2020',
    url: 'https://www.who.int/publications/i/item/9789240015128',
  },
  {
    id: 'steps',
    title: 'Daily steps and all-cause mortality: a meta-analysis of 15 international cohorts',
    citation: 'Paluch AE, Bajpai S, Bassett DR, et al. Lancet Public Health. 2022;7(3):e219–e228',
    url: 'https://doi.org/10.1016/S2468-2667(21)00302-9',
  },
];

/** The sources behind the daily calorie calculation (shown inside the calculator). */
export const calculatorSourceIds: NutritionSourceId[] = ['bmr', 'activity', 'bmi', 'deficit'];
