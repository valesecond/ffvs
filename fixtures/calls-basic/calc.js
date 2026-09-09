export function add(a, b) {
  return a + b;
}

export function total(values) {
  let sum = 0;
  for (const value of values) {
    sum = add(sum, value);
  }
  return sum;
}
