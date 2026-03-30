/** Validate 15-digit IMEI using the Luhn algorithm (check digit is the rightmost digit). */
export function imeiLuhnValid(digits15: string): boolean {
  if (!/^\d{15}$/.test(digits15)) {
    return false;
  }
  let sum = 0;
  let shouldDouble = false;
  for (let i = 14; i >= 0; i--) {
    let n = Number(digits15[i]);
    if (shouldDouble) {
      n *= 2;
      if (n > 9) {
        n -= 9;
      }
    }
    sum += n;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}
