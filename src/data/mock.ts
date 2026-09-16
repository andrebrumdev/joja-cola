import type { FlavorId } from "../lib/flavors";
import { ROAD_PATHS } from "./routeGeometry";
import { ROUTE_WAYPOINTS } from "./routeWaypoints";

// Cans are sold in packs of six (a 2x3 tray); prices are per can.
export const products: {
  id: string;
  flavor: FlavorId;
  name: string;
  pack: string;
  caseSize: number;
  price: number;
  storeStock: number;
  weeklySales: number;
  sku: string;
  /** One line for the product page. */
  description: string;
}[] = [
  {
    id: "lata-350",
    flavor: "tradicional",
    name: "Joja Cola Tradicional",
    pack: "Lata 350ml",
    caseSize: 6,
    price: 4.5,
    storeStock: 2,
    weeklySales: 9,
    sku: "JC-TRAD",
    description: "O sabor original da Joja Cola, para a pausa de trabalho e estudo.",
  },
  {
    id: "lata-limao",
    flavor: "limao",
    name: "Joja Cola Limão",
    pack: "Lata 350ml",
    caseSize: 6,
    price: 4.5,
    storeStock: 1,
    weeklySales: 4,
    sku: "JC-LIM",
    description: "Cola com limão: mais cítrica, boa companhia para o almoço.",
  },
  {
    id: "lata-uva",
    flavor: "uva",
    name: "Joja Cola Uva",
    pack: "Lata 350ml",
    caseSize: 6,
    price: 4.5,
    storeStock: 5,
    weeklySales: 4,
    sku: "JC-UVA",
    description: "Cola com uva: doce na medida, feita para dividir.",
  },
  {
    id: "lata-laranja",
    flavor: "laranja",
    name: "Joja Cola Laranja",
    pack: "Lata 350ml",
    caseSize: 6,
    price: 4.5,
    storeStock: 3,
    weeklySales: 5,
    sku: "JC-LAR",
    description: "Cola com laranja: leve e frutada, para o fim de tarde.",
  },
];

export type Product = (typeof products)[number];

export type OrderStatus = "Confirmado" | "Em rota" | "Entregue" | "Cancelado";

export type OrderItem = { productId: string; cases: number };

export type Order = {
  id: string;
  status: OrderStatus;
  origin: string;
  date: string;
  slot: string;
  partner: string;
  items: OrderItem[];
  /** Nota fiscal issued for the order. */
  invoice?: string;
  /** Delivery route, once dispatched. */
  routeId?: string;
};

export function orderTotal(items: OrderItem[]) {
  return items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return sum + (product ? product.price * product.caseSize * item.cases : 0);
  }, 0);
}

export const orders: Order[] = [
  {
    id: "100000000004",
    status: "Em rota",
    origin: "Fábrica Joja Norte",
    date: "16/09/2026",
    slot: "Hoje",
    partner: "Supermercado Vale",
    items: [{ productId: "lata-350", cases: 24 }],
    invoice: "NF-8847",
    routeId: "R-12",
  },
  {
    id: "100000000001",
    status: "Entregue",
    origin: "Fábrica Joja Norte",
    date: "12/09/2026",
    slot: "Pela manhã",
    partner: "Supermercado Vale",
    items: [
      { productId: "lata-350", cases: 20 },
      { productId: "lata-limao", cases: 10 },
      { productId: "lata-uva", cases: 8 },
      { productId: "lata-laranja", cases: 6 },
    ],
    invoice: "NF-8841",
  },
  {
    id: "100000000002",
    status: "Entregue",
    origin: "CD Centro",
    date: "10/09/2026",
    slot: "Pela manhã",
    partner: "Supermercado Vale",
    items: [
      { productId: "lata-350", cases: 10 },
      { productId: "lata-laranja", cases: 6 },
    ],
    invoice: "NF-8836",
  },
  {
    id: "100000000003",
    status: "Cancelado",
    origin: "Fábrica Joja Norte",
    date: "08/09/2026",
    slot: "Pela manhã",
    partner: "Supermercado Vale",
    items: [{ productId: "lata-uva", cases: 20 }],
  },
];

export type RouteStatus = "Em rota" | "Carregando" | "Planejada";

export type FleetRoute = {
  id: string;
  region: string;
  truck: string;
  stops: number;
  km: number;
  fuelSaved: string;
  status: RouteStatus;
  eta: string;
  color: string;
  /** Where the truck loads, and the last stop of the route (shown as the map's endpoints). */
  origin: string;
  destination: string;
  path: [number, number][];
};

/** The road a route drives (snapped with OSRM, see scripts/snap-routes-osrm.mjs); raw waypoints if missing. */
const roadPath = (id: string) => ROAD_PATHS[id] ?? ROUTE_WAYPOINTS[id];

export const routes: FleetRoute[] = [
  {
    id: "R-12",
    region: "Cidade Nova / Norte",
    truck: "Caminhão 04",
    stops: 18,
    km: 31,
    fuelSaved: "11%",
    status: "Em rota",
    eta: "14:20",
    color: "#00e5ff",
    origin: "Fábrica Joja Norte",
    destination: "Cidade Nova",
    path: roadPath("R-12"),
  },
  {
    id: "R-07",
    region: "Centro / Adrianópolis",
    truck: "Caminhão 02",
    stops: 24,
    km: 13,
    fuelSaved: "8%",
    status: "Carregando",
    eta: "15:05",
    color: "#38bdf8",
    origin: "CD Centro",
    destination: "Adrianópolis",
    path: roadPath("R-07"),
  },
  {
    id: "R-19",
    region: "Distrito Industrial",
    truck: "Caminhão 09",
    stops: 9,
    km: 16,
    fuelSaved: "14%",
    status: "Planejada",
    eta: "16:40",
    color: "#94a3b8",
    origin: "Fábrica Joja Norte",
    destination: "Distrito Industrial",
    path: roadPath("R-19"),
  },
];

export type PaymentStatus = "Aberto" | "Pago" | "Atrasado";

export type Payment = {
  id: string;
  partner: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  due: string;
  orderId?: string;
};

export const payments: Payment[] = [
  {
    id: "NF-8847",
    partner: "Supermercado Vale",
    amount: 648,
    method: "Boleto 14d",
    status: "Aberto",
    due: "30/09/2026",
    orderId: "100000000004",
  },
  {
    id: "NF-8841",
    partner: "Supermercado Vale",
    amount: 1188,
    method: "Boleto 14d",
    status: "Aberto",
    due: "26/09/2026",
    orderId: "100000000001",
  },
  {
    id: "NF-8836",
    partner: "Supermercado Vale",
    amount: 432,
    method: "PIX",
    status: "Pago",
    due: "10/09/2026",
    orderId: "100000000002",
  },
  {
    id: "NF-8812",
    partner: "Supermercado Vale",
    amount: 1512,
    method: "Boleto 21d",
    status: "Atrasado",
    due: "04/09/2026",
  },
];

// ---- Produção (SCADA da Fábrica Joja Norte) ----

export type Dosing = {
  id: "calda" | "agua" | "co2";
  label: string;
  unit: string;
  setpoint: number;
  tolerance: number;
  /** Scale shown on the meter. */
  min: number;
  max: number;
  decimals: number;
};

export const production = {
  plant: "Fábrica Joja Norte",
  lines: [
    {
      id: "L1",
      name: "Linha 1",
      product: "Joja Cola Tradicional · Lata 350ml",
      status: "Envasando" as const,
      unitsPerHour: 24000,
      efficiency: 96.4,
      batch: "L1-2609-08",
    },
    {
      id: "L2",
      name: "Linha 2",
      product: "Joja Cola Limão · Lata 350ml",
      status: "Limpeza CIP" as const,
      unitsPerHour: 0,
      efficiency: null,
      batch: "L2-2609-03",
      note: "Retoma às 15:30",
    },
  ],
  dosing: [
    { id: "calda", label: "Calda", unit: "%", setpoint: 18, tolerance: 0.3, min: 16.5, max: 19.5, decimals: 2 },
    { id: "agua", label: "Água tratada", unit: "%", setpoint: 82, tolerance: 0.3, min: 80.5, max: 83.5, decimals: 2 },
    { id: "co2", label: "CO₂", unit: "vol", setpoint: 3.8, tolerance: 0.1, min: 3.3, max: 4.3, decimals: 2 },
  ] satisfies Dosing[],
  wasteLimit: 0.5,
  waste: [
    { batch: "L1-2609-01", pct: 0.34 },
    { batch: "L1-2609-02", pct: 0.29 },
    { batch: "L1-2609-03", pct: 0.41 },
    { batch: "L1-2609-04", pct: 0.38 },
    { batch: "L1-2609-05", pct: 0.27 },
    { batch: "L1-2609-06", pct: 0.44 },
    { batch: "L1-2609-07", pct: 0.31 },
    { batch: "L1-2609-08", pct: 0.26 },
  ],
  events: [
    { time: "14:02", text: "CO₂ corrigido de 3,86 para 3,80 vol na Linha 1" },
    { time: "13:40", text: "Lote L1-2609-07 fechado · desperdício 0,31%" },
    { time: "13:15", text: "Linha 2 iniciou limpeza CIP programada" },
    { time: "12:48", text: "Brix da calda recalibrado · sensor S-14" },
  ],
};

// ---- Marketing (CRM + social listening) ----

export const marketing = {
  mentions: [
    { day: "10/09", count: 1180 },
    { day: "11/09", count: 1320 },
    { day: "12/09", count: 1260 },
    { day: "13/09", count: 1710 },
    { day: "14/09", count: 2040 },
    { day: "15/09", count: 1890 },
    { day: "16/09", count: 2230 },
  ],
  sentiment: { positive: 64, neutral: 24, negative: 12 },
  topics: [
    { topic: "Gelada no calor", count: 3120, tone: "positive" as const },
    { topic: "Joja Cola Limão", count: 1980, tone: "positive" as const },
    { topic: "Combo no almoço", count: 1240, tone: "neutral" as const },
    { topic: "Preço da lata", count: 860, tone: "negative" as const },
  ],
  seasonal: {
    product: "Joja Cola Gelo",
    signal: "Índice de interesse (menções + buscas), 0 a 100",
    threshold: 60,
    regions: [
      { region: "Cidade Nova / Norte", index: 82 },
      { region: "Centro / Adrianópolis", index: 71 },
      { region: "Zona Sul", index: 54 },
      { region: "Distrito Industrial", index: 38 },
    ],
  },
  campaigns: [
    { name: "Pausa gelada", audience: "16–24 anos · Zona Norte", reach: 48200, ctr: 3.4, orders: 312, status: "Ativa" as const },
    { name: "Combo almoço", audience: "Restaurantes · Centro", reach: 21500, ctr: 2.1, orders: 188, status: "Ativa" as const },
    { name: "Uva no lanche", audience: "25–40 anos · Zona Sul", reach: 30900, ctr: 1.2, orders: 64, status: "Pausada" as const },
  ],
};
