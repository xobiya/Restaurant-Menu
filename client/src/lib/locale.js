export const bi = (en, am) => `${en} / ${am}`;

export const statusLabels = {
  Pending: bi('Pending', 'በመጠበቅ ላይ'),
  Preparing: bi('Preparing', 'በማብሰል ላይ'),
  Ready: bi('Ready', 'ዝግጁ'),
  Completed: bi('Completed', 'ተጠናቋል'),
};

const categoryLabels = {
  'Daily Specials': bi('Daily Specials', 'የዛሬ ልዩ ምግቦች'),
  Beverages: bi('Beverages', 'መጠጦች'),
  'Main Dishes': bi('Main Dishes', 'ዋና ምግቦች'),
  Sides: bi('Sides', 'አጎን ምግቦች'),
};

export const formatCategoryLabel = (name) => categoryLabels[name] || name;
