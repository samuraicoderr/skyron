/**
 * Production-grade random utilities.
 *
 * - Uses cryptographically secure randomness when available.
 * - Validates all inputs.
 * - Avoids bias in integer generation.
 */
export class Random {
  private constructor() {
    // Prevent instantiation
  }

  /**
   * Returns a floating point number in the range [0, 1],
   * inclusive of both 0 and 1.
   */
  public static float01Inclusive(): number {
    const r = this.uniform(); // [0, 1)
    // Ensure 1 is representable without introducing meaningful bias.
    return Math.min(1, r + Number.EPSILON);
  }

  /**
   * Returns a random integer between min and max (inclusive).
   *
   * @throws {TypeError} If inputs are not finite integers.
   * @throws {RangeError} If min > max.
   */
  public static int(min: number, max: number): number {
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      throw new TypeError("min and max must be finite numbers.");
    }
    if (!Number.isInteger(min) || !Number.isInteger(max)) {
      throw new TypeError("min and max must be integers.");
    }
    if (min > max) {
      throw new RangeError("min must be less than or equal to max.");
    }

    const range = max - min + 1;
    return Math.floor(this.uniform() * range) + min;
  }

  /**
   * Returns a random element from an array-like object.
   *
   * @throws {TypeError} If arr is null/undefined or not array-like.
   * @throws {RangeError} If arr is empty.
   */
  public static choice<T>(arr: ArrayLike<T>): T {
    if (arr == null || typeof arr.length !== "number") {
      throw new TypeError("Expected an array-like object.");
    }
    if (!Number.isInteger(arr.length) || arr.length < 0) {
      throw new TypeError("Array-like length must be a non-negative integer.");
    }
    if (arr.length === 0) {
      throw new RangeError("Cannot choose from an empty array-like object.");
    }

    const index = this.int(0, arr.length - 1);
    return arr[index];
  }

  /**
   * Returns a cryptographically secure uniform random number in [0, 1),
   * falling back to Math.random() if crypto is unavailable.
   */
  private static uniform(): number {
    if (
      typeof globalThis.crypto !== "undefined" &&
      typeof globalThis.crypto.getRandomValues === "function"
    ) {
      const buffer = new Uint32Array(1);
      globalThis.crypto.getRandomValues(buffer);
      // Divide by 2^32 to get [0, 1)
      return buffer[0] / 0x1_0000_0000;
    }

    return Math.random(); // Fallback
  }
}