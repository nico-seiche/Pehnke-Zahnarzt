/**
 * Immediately run a function and return its result.
 * Can be used as an `IIFE` or a `do` expression.
 * @see https://maxgreenwald.me/blog/do-more-with-run
 */
export function run<T>(fn: () => T): T {
  return fn();
}

/**
 * Get types keys of an object.
 */
export function getObjectKeys<T extends object>(obj: T) {
  return Object.keys(obj) as (keyof T)[];
}

/**
 * Wait for a specified number of milliseconds.
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * @param array - The array to shuffle.
 * @returns A new array with the elements in random order.
 */
export function shuffle<T>(array: T[]): T[] {
  // Create a shallow copy to avoid mutating the original array
  const arr = array.slice();

  // Loop from the end of the array to the beginning
  for (let i = arr.length - 1; i > 0; i--) {
    // Pick a random index from 0 to i (inclusive)
    const j = Math.floor(Math.random() * (i + 1));

    // Swap elements at indices i and j
    // biome-ignore lint/style/noNonNullAssertion: safe
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }

  return arr;
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) {
    return str;
  }

  return str.charAt(0).toUpperCase() + str.slice(1);
}
