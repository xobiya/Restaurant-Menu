import api from './api';
import {
  enqueueOrder,
  getQueuedOrders,
  removeQueuedOrder,
  saveCustomerProfile,
  updateQueuedOrder,
  upsertOrderHistory,
} from './customerState';

export const PAYMENT_METHODS = [
  {
    id: 'Cash',
    type: 'cash',
    gatewayProvider: null,
    description_en: 'Pay at the table when your food arrives.',
    description_am: 'ምግቡ ሲመጣ በጠረጴዛው ላይ ይክፈሉ።',
  },
  {
    id: 'Telebirr',
    type: 'digital',
    gatewayProvider: 'Telebirr',
    description_en: 'Primary mobile payment for local customers.',
    description_am: 'ለአካባቢ ደንበኞች ዋና የሞባይል ክፍያ አማራጭ።',
  },
  {
    id: 'M-Pesa',
    type: 'digital',
    gatewayProvider: 'Chapa',
    description_en: 'Routed through the shared digital checkout flow.',
    description_am: 'በአጋራዊ ዲጂታል መክፈያ ፍሰት ይሰራል።',
  },
  {
    id: 'CBE Birr',
    type: 'digital',
    gatewayProvider: 'Chapa',
    description_en: 'Available through the same checkout handoff.',
    description_am: 'በተመሳሳይ የመክፈያ ሂደት ይገኛል።',
  },
  {
    id: 'HelloCash',
    type: 'digital',
    gatewayProvider: 'Chapa',
    description_en: 'Queued as a digital payment request for the counter.',
    description_am: 'እንደ ዲጂታል የክፍያ ጥያቄ ይመዘገባል።',
  },
  {
    id: 'Card',
    type: 'digital',
    gatewayProvider: 'Chapa',
    description_en: 'Card and wallet handoff in the same payment flow.',
    description_am: 'የካርድ እና ዋሌት ክፍያ በተመሳሳይ ፍሰት ይሰራል።',
  },
];

const buildLocalId = () => `local-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const isNetworkError = (error) => !error?.response;

export const getPaymentMethodConfig = (paymentMethod) =>
  PAYMENT_METHODS.find((method) => method.id === paymentMethod) || PAYMENT_METHODS[0];

export const buildOrderDraft = ({
  customerName,
  phone,
  tableNumber,
  items,
  paymentMethod,
}) => {
  const safeItems = items.map((item) => ({
    id: item.id,
    name: item.name,
    price: Number(item.price),
    quantity: Number(item.quantity),
    image_url: item.image_url,
  }));

  return {
    localId: buildLocalId(),
    createdAt: new Date().toISOString(),
    customerName: String(customerName || '').trim(),
    phone: String(phone || '').trim(),
    tableNumber: Number(tableNumber),
    paymentMethod,
    items: safeItems,
    total: safeItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
  };
};

const createRemoteOrder = async (draft) => {
  const methodConfig = getPaymentMethodConfig(draft.paymentMethod);

  const orderResponse = await api.post('/orders', {
    table_number: draft.tableNumber,
    items: draft.items.map((item) => ({
      menuItemId: item.id,
      quantity: item.quantity,
    })),
    customer_name: draft.customerName,
    customer_phone: draft.phone,
    payment_method: draft.paymentMethod,
  });

  const order = orderResponse.data;

  if (methodConfig.type === 'cash') {
    return { order, payment: null };
  }

  const paymentResponse = await api.post('/payments/initiate', {
    orderId: order.id,
    provider: draft.paymentMethod,
    customerInfo: {
      name: draft.customerName,
      phone: draft.phone,
      table_number: draft.tableNumber,
      requestedProvider: draft.paymentMethod,
    },
  });

  return {
    order,
    payment: paymentResponse.data,
  };
};

const saveQueuedHistory = (draft) =>
  upsertOrderHistory({
    localId: draft.localId,
    createdAt: draft.createdAt,
    customerName: draft.customerName,
    phone: draft.phone,
    tableNumber: draft.tableNumber,
    items: draft.items,
    total: draft.total,
    paymentMethod: draft.paymentMethod,
    syncState: 'queued',
    orderStatus: 'Pending',
    paymentStatus: draft.paymentMethod === 'Cash' ? 'Unpaid' : 'Pending',
  });

const saveSyncedHistory = (draft, result) => {
  const paymentMethodConfig = getPaymentMethodConfig(draft.paymentMethod);

  return upsertOrderHistory({
    localId: draft.localId,
    orderId: result.order.id,
    txRef: result.payment?.tx_ref || null,
    createdAt: draft.createdAt,
    customerName: draft.customerName,
    phone: draft.phone,
    tableNumber: draft.tableNumber,
    items: draft.items,
    total: Number(result.order.total_amount || draft.total),
    paymentMethod: draft.paymentMethod,
    paymentGateway: paymentMethodConfig.gatewayProvider,
    syncState: 'synced',
    orderStatus: result.order.status,
    paymentStatus: result.payment ? 'Pending' : result.order.payment_status || 'Unpaid',
  });
};

export const placeOrderDraft = async (draft) => {
  saveCustomerProfile({
    customerName: draft.customerName,
    phone: draft.phone,
  });

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueOrder(draft);
    saveQueuedHistory(draft);
    return {
      status: 'queued',
      draft,
    };
  }

  try {
    const result = await createRemoteOrder(draft);
    saveSyncedHistory(draft, result);
    return {
      status: 'synced',
      draft,
      result,
    };
  } catch (error) {
    if (isNetworkError(error)) {
      enqueueOrder(draft);
      saveQueuedHistory(draft);
      return {
        status: 'queued',
        draft,
        error,
      };
    }

    throw error;
  }
};

export const syncQueuedOrders = async () => {
  const queuedOrders = getQueuedOrders();
  const syncedOrders = [];

  for (const draft of queuedOrders) {
    updateQueuedOrder(draft.localId, {
      syncState: 'syncing',
    });

    upsertOrderHistory({
      localId: draft.localId,
      syncState: 'syncing',
    });

    try {
      const result = await createRemoteOrder(draft);
      removeQueuedOrder(draft.localId);
      saveSyncedHistory(draft, result);
      syncedOrders.push({
        draft,
        result,
      });
    } catch (error) {
      updateQueuedOrder(draft.localId, {
        syncState: 'queued',
        syncError: error?.message || 'Sync failed',
      });

      upsertOrderHistory({
        localId: draft.localId,
        syncState: 'queued',
      });

      if (isNetworkError(error)) {
        break;
      }
    }
  }

  return syncedOrders;
};
