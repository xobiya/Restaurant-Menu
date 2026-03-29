import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'restaurant_lang';
const LANGUAGE_EVENT = 'restaurant-lang-change';

const texts = {
  menu: { en: 'Menu', am: 'ምናሌ' },
  order: { en: 'Order', am: 'ትዕዛዝ' },
  track: { en: 'Track', am: 'ክትትል' },
  table: { en: 'Table', am: 'ጠረጴዛ' },
  all: { en: 'All', am: 'ሁሉም' },
  search: { en: 'Search...', am: 'ፈልግ...' },
  subtotal: { en: 'Subtotal', am: 'ድምር' },
  total: { en: 'Total', am: 'ጠቅላላ' },
  paymentMethod: { en: 'Payment Method', am: 'የክፍያ ዘዴ' },
  placeOrderPay: { en: 'Place Order & Pay', am: 'ትዕዛዝ ይላኩ እና ይክፈሉ' },
  processingPayment: { en: 'Processing payment...', am: 'ክፍያ በሂደት ላይ...' },
  fastOrderOn: { en: 'Fast Order ON', am: 'ፈጣን ትዕዛዝ በርቷል' },
  fastOrderOff: { en: 'Fast Order OFF', am: 'ፈጣን ትዕዛዝ ጠፍቷል' },
  itemsSelected: { en: 'items selected', am: 'የተመረጡ እቃዎች' },
  addSelected: { en: 'Add Selected to Order', am: 'የተመረጡትን ወደ ትዕዛዝ ያክሉ' },
  yourOrder: { en: 'Your Order', am: 'የእርስዎ ትዕዛዝ' },
  orderEmpty: { en: 'Your order is empty.', am: 'ምንም ትዕዛዝ አልተመረጠም።' },
  items: { en: 'items', am: 'እቃዎች' },
  estimatedTime: { en: 'Estimated Time', am: 'የተገመተ ጊዜ' },
  mins: { en: 'mins', am: 'ደቂቃ' },
  orderDetails: { en: 'Order Details', am: 'የትዕዛዝ ዝርዝር' },
  selectTablePrompt: { en: 'Enter your table number to continue ordering.', am: 'ለመቀጠል የጠረጴዛ ቁጥር ያስገቡ።' },
  saveTable: { en: 'Save Table', am: 'ጠረጴዛ ያስቀምጡ' },
  editTable: { en: 'Change Table', am: 'ጠረጴዛ ይቀይሩ' },
  tableRequired: { en: 'Table number is required before placing an order.', am: 'ትዕዛዝ ከመላክዎ በፊት የጠረጴዛ ቁጥር ያስገቡ።' },
  backToMenu: { en: 'Back to menu', am: 'ወደ ምናሌ ተመለስ' },
  backToRestaurant: { en: 'Back to restaurant', am: 'ወደ ሬስቶራንቱ ተመለስ' },
  back: { en: 'Back', am: 'ተመለስ' },
  trackOrder: { en: 'Track Order', am: 'ትዕዛዝ ይከታተሉ' },
  trackYourOrder: { en: 'Track Your Order', am: 'ትዕዛዝዎን ይከታተሉ' },
  pasteOrderId: { en: 'Paste order ID', am: 'የትዕዛዝ መለያ ያስገቡ' },
  fetchOrderStatus: { en: 'Fetching order status...', am: 'የትዕዛዝ ሁኔታ በመጫን ላይ...' },
  noItemsMatching: { en: 'No items found matching', am: 'ከፍለጋዎ ጋር የሚስማማ እቃ አልተገኘም' },
  checkoutFailed: { en: 'Checkout failed. Ensure backend is running.', am: 'ክፍያ አልተሳካም። ባክኤንድ እየሰራ መሆኑን ያረጋግጡ።' },
  loadingPayment: { en: 'Loading payment...', am: 'ክፍያ በመጫን ላይ...' },
  transactionNotFound: { en: 'Transaction not found', am: 'የክፍያ መረጃ አልተገኘም' },
  checkout: { en: 'Checkout', am: 'መክፈያ' },
  amount: { en: 'Amount', am: 'መጠን' },
  status: { en: 'Status', am: 'ሁኔታ' },
  processing: { en: 'Processing...', am: 'በሂደት ላይ...' },
  completePayment: { en: 'Complete Payment', am: 'ክፍያውን ያጠናቅቁ' },
  markFailed: { en: 'Mark as Failed', am: 'እንዳልተሳካ አሳይ' },
  trackMyOrder: { en: 'Track My Order', am: 'ትዕዛዜን እከታተላለሁ' },
  returnToOrder: { en: 'Return to Order', am: 'ወደ ትዕዛዝ ተመለስ' },
  enterOrderIdHelp: { en: 'Enter your order ID to see live status updates.', am: 'ቀጥታ ሁኔታ ለማየት የትዕዛዝ መለያ ያስገቡ።' },
  failedFetchOrder: { en: 'Failed to fetch order', am: 'ትዕዛዝ አልተገኘም' },
  add: { en: 'Add', am: 'ጨምር' },
  language: { en: 'Language', am: 'ቋንቋ' },
};

const statusMap = {
  Pending: { en: 'Pending', am: 'በመጠበቅ ላይ' },
  Preparing: { en: 'Preparing', am: 'በማዘጋጀት ላይ' },
  Ready: { en: 'Ready', am: 'ዝግጁ' },
  Completed: { en: 'Completed', am: 'ተጠናቋል' },
  Paid: { en: 'Paid', am: 'ተከፍሏል' },
  Failed: { en: 'Failed', am: 'አልተሳካም' },
  Unpaid: { en: 'Unpaid', am: 'ያልተከፈለ' },
  PendingPayment: { en: 'Pending', am: 'በመጠበቅ ላይ' },
};

const categoryMap = {
  'Daily Specials': { en: 'Daily Specials', am: 'የዛሬ ልዩ ምግቦች' },
  Beverages: { en: 'Beverages', am: 'መጠጦች' },
  'Main Dishes': { en: 'Main Dishes', am: 'ዋና ምግቦች' },
  Sides: { en: 'Sides', am: 'አጎን ምግቦች' },
};

const normalizeLanguage = (value) => (value === 'am' ? 'am' : 'en');

export const getStoredLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  return normalizeLanguage(localStorage.getItem(STORAGE_KEY));
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

  const setLanguage = (nextLanguage) => {
    setStoredLanguage(nextLanguage);
  };

  return { language, setLanguage, t, formatCategoryLabel, statusLabel };
};

