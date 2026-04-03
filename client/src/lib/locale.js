import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'restaurant_lang';
const LANGUAGE_EVENT = 'restaurant-lang-change';

const texts = {
  home: { en: 'Home', am: 'መነሻ' },
  menu: { en: 'Menu', am: 'ምናሌ' },
  order: { en: 'Cart', am: 'ጋሪ' },
  orders: { en: 'Orders', am: 'ትዕዛዞች' },
  track: { en: 'Track', am: 'ክትትል' },
  viewMenu: { en: 'View Menu', am: 'ምናሌ ተመልከት' },
  table: { en: 'Table', am: 'ጠረጴዛ' },
  tableReady: { en: 'Your table number is saved and ready for checkout.', am: 'የጠረጴዛ ቁጥርዎ ተቀምጦ ለትዕዛዝ ዝግጁ ነው።' },
  scanTableHint: { en: 'Scan the table QR or enter the number before checkout.', am: 'ከመክፈያ በፊት የጠረጴዛውን QR ይስካን ወይም ቁጥሩን ያስገቡ።' },
  all: { en: 'All', am: 'ሁሉም' },
  search: { en: 'Search dishes, drinks, or ingredients...', am: 'ምግብ፣ መጠጥ ወይም እቃ ይፈልጉ...' },
  subtotal: { en: 'Subtotal', am: 'ንዑስ ድምር' },
  total: { en: 'Total', am: 'ጠቅላላ' },
  paymentMethod: { en: 'Payment Method', am: 'የክፍያ ዘዴ' },
  placeOrderPay: { en: 'Place Order', am: 'ትዕዛዝ አስገባ' },
  processingPayment: { en: 'Processing order...', am: 'ትዕዛዙ በሂደት ላይ ነው...' },
  yourOrder: { en: 'Your Cart', am: 'የእርስዎ ጋሪ' },
  orderEmpty: { en: 'Your cart is empty.', am: 'ጋሪዎ ባዶ ነው።' },
  items: { en: 'items', am: 'እቃዎች' },
  estimatedTime: { en: 'Estimated Time', am: 'የተገመተ ጊዜ' },
  mins: { en: 'mins', am: 'ደቂቃ' },
  orderDetails: { en: 'Order Details', am: 'የትዕዛዝ ዝርዝር' },
  selectTablePrompt: { en: 'Enter your table or seat number to continue ordering.', am: 'ትዕዛዙን ለመቀጠል የጠረጴዛ ወይም የመቀመጫ ቁጥር ያስገቡ።' },
  saveTable: { en: 'Save Table', am: 'ጠረጴዛ አስቀምጥ' },
  editTable: { en: 'Change Table', am: 'ጠረጴዛ ቀይር' },
  tableRequired: { en: 'A valid table number is required before placing an order.', am: 'ትዕዛዝ ከመላክዎ በፊት የትክክለኛ ጠረጴዛ ቁጥር ያስገቡ።' },
  backToMenu: { en: 'Back to menu', am: 'ወደ ምናሌ ተመለስ' },
  backToRestaurant: { en: 'Back to home', am: 'ወደ መነሻ ተመለስ' },
  back: { en: 'Back', am: 'ተመለስ' },
  trackOrder: { en: 'Track Order', am: 'ትዕዛዝ ተከታተል' },
  trackYourOrder: { en: 'Track your live order', am: 'የቀጥታ ትዕዛዝዎን ይከታተሉ' },
  pasteOrderId: { en: 'Enter an order ID', am: 'የትዕዛዝ መለያ ያስገቡ' },
  fetchOrderStatus: { en: 'Fetching order status...', am: 'የትዕዛዝ ሁኔታ በመጫን ላይ...' },
  noItemsMatching: { en: 'No menu items match your search yet.', am: 'ከፍለጋዎ ጋር የሚስማሙ ምግቦች አልተገኙም።' },
  checkoutFailed: { en: 'We could not complete the checkout right now.', am: 'መክፈያው አልተሳካም።' },
  loadingPayment: { en: 'Loading payment...', am: 'ክፍያ በመጫን ላይ...' },
  transactionNotFound: { en: 'Payment transaction not found.', am: 'የክፍያ መረጃ አልተገኘም።' },
  checkout: { en: 'Checkout', am: 'መክፈያ' },
  amount: { en: 'Amount', am: 'መጠን' },
  status: { en: 'Status', am: 'ሁኔታ' },
  processing: { en: 'Processing...', am: 'በሂደት ላይ...' },
  completePayment: { en: 'Complete Payment', am: 'ክፍያውን ጨርስ' },
  markFailed: { en: 'Mark as Failed', am: 'እንዳልተሳካ አሳይ' },
  trackMyOrder: { en: 'Track My Order', am: 'ትዕዛዜን እከታተላለሁ' },
  returnToOrder: { en: 'Return to cart', am: 'ወደ ጋሪ ተመለስ' },
  enterOrderIdHelp: { en: 'Use your order ID to reopen live tracking at any time.', am: 'የትዕዛዝ መለያዎን በመጠቀም ቀጥታ ክትትሉን እንደገና ይክፈቱ።' },
  failedFetchOrder: { en: 'Failed to fetch order.', am: 'ትዕዛዙን ማምጣት አልተቻለም።' },
  add: { en: 'Add', am: 'ጨምር' },
  language: { en: 'Language', am: 'ቋንቋ' },
  offlineReady: { en: 'Offline Ready', am: 'ለኦፍላይን ዝግጁ' },
  queuedOrdersReady: { en: 'Queued orders will sync automatically when the internet comes back.', am: 'ኢንተርኔት ሲመለስ የተሰለፉ ትዕዛዞች በራስ-ሰር ይላካሉ።' },
  cachedMenuReady: { en: 'The menu stays cached for browsing even when the connection dips.', am: 'ኢንተርኔት ቢወርድም ምናሌው ለመቃኘት ተቀምጦ ይቆያል።' },
  quickSettings: { en: 'Quick Settings', am: 'ፈጣን ቅንብሮች' },
  customizeExperience: { en: 'Set the app up for your table', am: 'አፑን ለጠረጴዛዎ ያዘጋጁ' },
  lowDataMode: { en: 'Low-data mode', am: 'ዝቅተኛ ዳታ ሁኔታ' },
  lowDataHelper: { en: 'Use lighter images for slower networks and cheaper data usage.', am: 'ለዝግ ኔትወርክ እና ለቀላል ዳታ አጠቃቀም ቀለል ያሉ ምስሎችን ይጠቀሙ።' },
  fastingMode: { en: 'Fasting-first filter', am: 'የጾም ማጣሪያ' },
  fastingModeHelper: { en: 'Keep fasting and vegetarian dishes at the front of the menu.', am: 'የጾም እና የቬጀቴሪያን ምግቦችን በመጀመሪያ ያሳዩ።' },
  recentOrders: { en: 'Recent Orders', am: 'የቅርብ ትዕዛዞች' },
  keepTracking: { en: 'Reopen your last orders quickly', am: 'ያለፉትን ትዕዛዞች ፈጣን ያግኙ' },
  openOrders: { en: 'Open orders', am: 'ትዕዛዞችን ክፈት' },
  recentOrdersEmpty: { en: 'Your recent orders will show up here after checkout.', am: 'ከመክፈያ በኋላ የቅርብ ትዕዛዞችዎ እዚህ ይታያሉ።' },
  browseDishes: { en: 'Browse dishes', am: 'ምግቦችን ተመልከት' },
  goToCart: { en: 'Go to cart', am: 'ወደ ጋሪ ሂድ' },
  trackOrders: { en: 'Track orders', am: 'ትዕዛዞችን ከታተል' },
  queued: { en: 'Queued', am: 'ተሰልፏል' },
  queueNotice: { en: 'This order is stored offline and will sync automatically.', am: 'ይህ ትዕዛዝ ኦፍላይን ተቀምጦ ኢንተርኔት ሲመለስ ይላካል።' },
  orderQueuedSuccess: { en: 'Order saved offline. We will send it when you are back online.', am: 'ትዕዛዙ ኦፍላይን ተቀምጧል። ኦንላይን ሲመለሱ እንልካዋለን።' },
  orderPlacedSuccess: { en: 'Order sent to the kitchen.', am: 'ትዕዛዙ ወደ ኩሽና ተልኳል።' },
  customerName: { en: 'Name', am: 'ስም' },
  customerNamePlaceholder: { en: 'Your name', am: 'ስምዎ' },
  phoneOptional: { en: 'Phone (optional)', am: 'ስልክ (አማራጭ)' },
  phonePlaceholder: { en: '09...', am: '09...' },
  paymentQueuedHint: { en: 'Digital payment links stay available in your order history.', am: 'ዲጂታል የክፍያ ሊንኮች በትዕዛዝ ታሪክዎ ውስጥ ይቆያሉ።' },
  cashPaymentHint: { en: 'Cash orders go straight to the kitchen and stay unpaid until served.', am: 'በጥሬ ገንዘብ የሚከፈሉ ትዕዛዞች በቀጥታ ወደ ኩሽና ይሄዳሉ እና እስኪቀርቡ ድረስ ያልተከፈሉ ይቆያሉ።' },
  liveHistory: { en: 'Saved order history', am: 'የተቀመጠ የትዕዛዝ ታሪክ' },
  openPayment: { en: 'Open payment', am: 'ክፍያ ክፈት' },
  openTracking: { en: 'Open tracking', am: 'ክትትል ክፈት' },
  browseAgain: { en: 'Browse again', am: 'እንደገና ተመልከት' },
  featuredToday: { en: 'Featured Today', am: 'ዛሬ የተመረጡ' },
  fastingFriendly: { en: 'Fasting Friendly', am: 'ለጾም ተስማሚ' },
  vegetarian: { en: 'Vegetarian', am: 'ቬጀቴሪያን' },
  portionNote: { en: 'Serving note', am: 'የማቅረቢያ ማስታወሻ' },
  spiceMild: { en: 'Mild', am: 'ቀለል ያለ' },
  spiceMedium: { en: 'Medium', am: 'መካከለኛ' },
  spiceHot: { en: 'Hot', am: 'በጣም ቅመም' },
};

const statusMap = {
  Pending: { en: 'Pending', am: 'በመጠበቅ ላይ' },
  Preparing: { en: 'Preparing', am: 'በመዘጋጀት ላይ' },
  Ready: { en: 'Ready', am: 'ዝግጁ' },
  Completed: { en: 'Completed', am: 'ተጠናቋል' },
  Paid: { en: 'Paid', am: 'ተከፍሏል' },
  Failed: { en: 'Failed', am: 'አልተሳካም' },
  Unpaid: { en: 'Unpaid', am: 'ያልተከፈለ' },
  PendingPayment: { en: 'Pending Payment', am: 'ክፍያ በመጠበቅ ላይ' },
  Queued: { en: 'Queued', am: 'ተሰልፏል' },
  Syncing: { en: 'Syncing', am: 'በማዛመድ ላይ' },
};

const paymentMethodMap = {
  Cash: { en: 'Cash', am: 'ጥሬ ገንዘብ' },
  Telebirr: { en: 'Telebirr', am: 'ቴሌብር' },
  'M-Pesa': { en: 'M-Pesa', am: 'ኤም-ፔሳ' },
  'CBE Birr': { en: 'CBE Birr', am: 'ሲቢኢ ብር' },
  HelloCash: { en: 'HelloCash', am: 'ሄሎካሽ' },
  Card: { en: 'Card / Wallet', am: 'ካርድ / ዋሌት' },
  Chapa: { en: 'Chapa Checkout', am: 'ቻፓ መክፈያ' },
};

const categoryMap = {
  'Fasting Specials': { en: 'Fasting Specials', am: 'የጾም ምግቦች' },
  'Signature Wats': { en: 'Signature Wats', am: 'የቤቱ ወጦች' },
  'Tibs & Meat': { en: 'Tibs & Meat', am: 'ቲብስ እና ስጋ' },
  'Injera & Sides': { en: 'Injera & Sides', am: 'እንጀራ እና አጎኖች' },
  'Coffee & Drinks': { en: 'Coffee & Drinks', am: 'ቡና እና መጠጦች' },
  'Daily Specials': { en: 'Daily Specials', am: 'የዛሬ ልዩ ምግቦች' },
  Beverages: { en: 'Beverages', am: 'መጠጦች' },
  'Main Dishes': { en: 'Main Dishes', am: 'ዋና ምግቦች' },
  Sides: { en: 'Sides', am: 'አጎኖች' },
};

const normalizeLanguage = (value) => (value === 'en' ? 'en' : 'am');

export const getStoredLanguage = () => {
  if (typeof window === 'undefined') return 'am';
  return normalizeLanguage(localStorage.getItem(STORAGE_KEY) || 'am');
};

export const setStoredLanguage = (language) => {
  if (typeof window === 'undefined') return;
  const normalized = normalizeLanguage(language);
  localStorage.setItem(STORAGE_KEY, normalized);
  window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: normalized }));
};

export const tByLanguage = (key, language) => {
  const normalized = normalizeLanguage(language);
  return texts[key]?.[normalized] || texts[key]?.en || key;
};

export const formatCategoryLabelByLanguage = (name, language) => {
  const normalized = normalizeLanguage(language);
  return categoryMap[name]?.[normalized] || name;
};

export const statusLabelByLanguage = (status, language) => {
  const normalized = normalizeLanguage(language);
  return statusMap[status]?.[normalized] || status;
};

export const paymentMethodLabelByLanguage = (method, language) => {
  const normalized = normalizeLanguage(language);
  return paymentMethodMap[method]?.[normalized] || method;
};

export const useLocale = () => {
  const [language, setLanguageState] = useState(getStoredLanguage);

  useEffect(() => {
    const onLanguageChange = (event) => {
      setLanguageState(normalizeLanguage(event?.detail || getStoredLanguage()));
    };

    window.addEventListener(LANGUAGE_EVENT, onLanguageChange);
    return () => window.removeEventListener(LANGUAGE_EVENT, onLanguageChange);
  }, []);

  const t = useMemo(() => (key) => tByLanguage(key, language), [language]);
  const formatCategoryLabel = useMemo(
    () => (name) => formatCategoryLabelByLanguage(name, language),
    [language]
  );
  const statusLabel = useMemo(
    () => (status) => statusLabelByLanguage(status, language),
    [language]
  );
  const paymentMethodLabel = useMemo(
    () => (method) => paymentMethodLabelByLanguage(method, language),
    [language]
  );

  const setLanguage = (nextLanguage) => {
    setStoredLanguage(nextLanguage);
  };

  return {
    language,
    setLanguage,
    t,
    formatCategoryLabel,
    statusLabel,
    paymentMethodLabel,
  };
};
