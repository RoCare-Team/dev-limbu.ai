export function emitWalletDeduct(amount) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("wallet:deducted", { detail: { amount } }));
}

export function emitWalletUpdate(newBalance) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("wallet:updated", { detail: { balance: newBalance } }));
}

export function emitWalletCredit(amount) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("wallet:credited", { detail: { amount } }));
}