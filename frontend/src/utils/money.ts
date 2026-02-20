export const gbpToPence = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }
  const [whole, fraction = ''] = trimmed.split('.');
  const normalizedFraction = fraction.padEnd(2, '0');
  const pence = Number(whole) * 100 + Number(normalizedFraction);
  return Number.isFinite(pence) && pence > 0 ? pence : null;
};

export const formatMoney = (pence: number) => {
  const sign = pence < 0 ? '-' : '';
  const abs = Math.abs(pence);
  const pounds = Math.floor(abs / 100);
  const pennies = String(abs % 100).padStart(2, '0');
  return `${sign}£${pounds}.${pennies}`;
};
