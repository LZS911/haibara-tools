export const fixed = (n: number, precision = 1) => {
  const multiplier = Math.pow(10, precision);
  return (Math.round(n * multiplier) / multiplier).toString();
};
