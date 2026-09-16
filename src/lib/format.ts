export const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const packs = (n: number) => `${n.toLocaleString("pt-BR")} ${n === 1 ? "pack" : "packs"}`;

/** "~2 dias": how long the store's shelf lasts, never below one day. */
export const days = (n: number) => {
  const rounded = Math.max(1, Math.round(n));
  return `~${rounded} ${rounded === 1 ? "dia" : "dias"}`;
};
