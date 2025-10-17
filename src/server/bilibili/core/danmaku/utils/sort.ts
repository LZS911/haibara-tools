export const ascendingSort =
  <T>(key: (it: T) => number) =>
  (a: T, b: T) =>
    key(a) - key(b);
