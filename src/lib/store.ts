import { useSyncExternalStore } from "react";
import {
  orderTotal,
  orders as seedOrders,
  payments as seedPayments,
  products,
  type Order,
  type OrderItem,
  type Payment,
} from "../data/mock";

// Session-scoped app state: the cart, plus orders and invoices placed during the
// demo. Seed data stays in mock.ts; placed records are layered on top.

type State = {
  cart: Record<string, number>;
  orders: Order[];
  payments: Payment[];
};

const KEY = "joja.store.v1";
const STORE = "Supermercado Vale";
const listeners = new Set<() => void>();

function load(): State {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    // Storage unavailable: fall back to an in-memory session.
  }
  return { cart: {}, orders: [], payments: [] };
}

let state = load();

function commit(next: State) {
  state = next;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Keep working in memory.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppState() {
  return useSyncExternalStore(subscribe, () => state);
}

export const allOrders = (s: State) => [...s.orders, ...seedOrders];
export const allPayments = (s: State) => [...s.payments, ...seedPayments];

export function cartItems(s: State): OrderItem[] {
  return products
    .filter((p) => (s.cart[p.id] ?? 0) > 0)
    .map((p) => ({ productId: p.id, cases: s.cart[p.id] }));
}

export const cartCases = (s: State) => Object.values(s.cart).reduce((a, n) => a + n, 0);

/** Cases the store should order so stock covers ~1.5 weeks of its own sales. */
export function suggestedCases(product: (typeof products)[number]) {
  return Math.max(1, Math.ceil(product.weeklySales * 1.5 - product.storeStock));
}

/** Days until the store runs out at its current sales pace. */
export const coverageDays = (product: (typeof products)[number]) =>
  (product.storeStock / product.weeklySales) * 7;

export const STOCKOUT_DAYS = 3;

export const cart = {
  add(productId: string, cases: number) {
    commit({ ...state, cart: { ...state.cart, [productId]: (state.cart[productId] ?? 0) + cases } });
  },
  set(productId: string, cases: number) {
    const next = { ...state.cart };
    if (cases > 0) next[productId] = cases;
    else delete next[productId];
    commit({ ...state, cart: next });
  },
  /** "1 toque": put a past order's items back in the cart. */
  reorder(order: Order) {
    const next = { ...state.cart };
    order.items.forEach((item) => {
      next[item.productId] = (next[item.productId] ?? 0) + item.cases;
    });
    commit({ ...state, cart: next });
  },
};

const pad = (n: number) => String(n).padStart(2, "0");
const brDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

export function placeOrder(): Order | null {
  const items = cartItems(state);
  if (items.length === 0) return null;

  const orders = allOrders(state);
  const nextId = String(Math.max(...orders.map((o) => Number(o.id))) + 1).padStart(12, "0");
  const invoiceNumbers = allPayments(state).map((p) => Number(p.id.replace("NF-", "")));
  const invoice = `NF-${Math.max(...invoiceNumbers) + 1}`;
  const today = new Date();
  const due = new Date(today);
  due.setDate(due.getDate() + 14);

  const order: Order = {
    id: nextId,
    status: "Confirmado",
    origin: "Fábrica Joja Norte",
    date: brDate(today),
    slot: "Próxima rota · Pela manhã",
    partner: STORE,
    items,
    invoice,
  };
  const payment: Payment = {
    id: invoice,
    partner: STORE,
    amount: orderTotal(items),
    method: "Boleto 14d",
    status: "Aberto",
    due: brDate(due),
    orderId: nextId,
  };
  commit({ cart: {}, orders: [order, ...state.orders], payments: [payment, ...state.payments] });
  return order;
}
