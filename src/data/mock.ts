export const products = [
  {
    id: "lata-350",
    name: "Joja Cola Tradicional",
    pack: "Lata 350ml",
    caseSize: 12,
    price: 4.5,
    stock: 18420,
    sku: "JC-350",
    note: "Consumo individual. Pausa de trabalho e estudo.",
    featured: true,
  },
  {
    id: "pet-2l",
    name: "Joja Cola Família",
    pack: "PET 2L",
    caseSize: 6,
    price: 9.9,
    stock: 6210,
    sku: "JC-2L",
    note: "Refeições e confraternização.",
  },
  {
    id: "zero-350",
    name: "Joja Cola Zero",
    pack: "Lata 350ml",
    caseSize: 12,
    price: 4.5,
    stock: 9030,
    sku: "JC-Z350",
    note: "Mesma refrescância, sem açúcar.",
  },
  {
    id: "gelo-1l",
    name: "Joja Cola Gelo",
    pack: "Garrafa 1L",
    caseSize: 6,
    price: 7.2,
    stock: 2140,
    sku: "JC-GELO",
    note: "Edição sazonal. Pico de verão.",
  },
];

export const orders = [
  {
    id: "100000000001",
    status: "Entregue" as const,
    total: 1284,
    origin: "Fábrica Joja Norte",
    date: "12/09/2026",
    slot: "Pela manhã",
    partner: "Supermercado Vale",
  },
  {
    id: "100000000002",
    status: "Entregue" as const,
    total: 492,
    origin: "CD Centro",
    date: "10/09/2026",
    slot: "Pela manhã",
    partner: "Rede Lanche Rápido",
  },
  {
    id: "100000000003",
    status: "Cancelado" as const,
    total: 870,
    origin: "Fábrica Joja Norte",
    date: "08/09/2026",
    slot: "Pela manhã",
    partner: "JojaMart Pelican",
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
  path: [number, number][];
};

export const routes: FleetRoute[] = [
  {
    id: "R-12",
    region: "Cidade Nova / Norte",
    truck: "Caminhão 04",
    stops: 18,
    km: 42,
    fuelSaved: "11%",
    status: "Em rota",
    eta: "14:20",
    color: "#00e5ff",
    path: [
      [-60.0236, -3.1303],
      [-60.018, -3.1],
      [-60.012, -3.07],
      [-60.008, -3.045],
      [-60.0, -3.028],
      [-60.022, -3.04],
      [-60.03, -3.075],
    ],
  },
  {
    id: "R-07",
    region: "Centro / Adrianópolis",
    truck: "Caminhão 02",
    stops: 24,
    km: 31,
    fuelSaved: "8%",
    status: "Carregando",
    eta: "15:05",
    color: "#38bdf8",
    path: [
      [-60.016, -3.118],
      [-60.008, -3.112],
      [-60.012, -3.102],
      [-60.023, -3.108],
      [-60.028, -3.122],
      [-60.02, -3.128],
    ],
  },
  {
    id: "R-19",
    region: "Distrito Industrial",
    truck: "Caminhão 09",
    stops: 9,
    km: 67,
    fuelSaved: "14%",
    status: "Planejada",
    eta: "16:40",
    color: "#94a3b8",
    path: [
      [-60.0236, -3.1303],
      [-60.01, -3.135],
      [-59.99, -3.128],
      [-59.97, -3.122],
      [-59.955, -3.118],
    ],
  },
];

export const payments = [
  {
    id: "NF-8841",
    partner: "Supermercado Vale",
    amount: 12840,
    method: "Boleto 14d",
    status: "Aberto",
    due: "22/09/2026",
  },
  {
    id: "NF-8836",
    partner: "Rede Lanche Rápido",
    amount: 4920,
    method: "PIX",
    status: "Pago",
    due: "12/09/2026",
  },
  {
    id: "NF-8820",
    partner: "Distribuidora Costa",
    amount: 30150,
    method: "TED",
    status: "Pago",
    due: "08/09/2026",
  },
  {
    id: "NF-8812",
    partner: "JojaMart Pelican",
    amount: 8700,
    method: "Boleto 21d",
    status: "Atrasado",
    due: "04/09/2026",
  },
];
