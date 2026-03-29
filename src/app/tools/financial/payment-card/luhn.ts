/** Luhn (mod 10) check for payment card numbers. */

export function luhnValid(digits: string): boolean {
  const s = digits.replace(/\D/g, '');
  if (s.length < 2) {
    return false;
  }
  let sum = 0;
  let alt = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let n = parseInt(s[i]!, 10);
    if (alt) {
      n *= 2;
      if (n > 9) {
        n -= 9;
      }
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}
