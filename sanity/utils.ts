import type { Rule } from "sanity";
import { SANITY_SINGLETON_HOMEPAGE_ID } from "./constants";

export function isHomepageDocument(source: { _id?: unknown } | null | undefined): boolean {
  const raw = source?._id;

  if (typeof raw !== "string") {
    return false;
  }

  return raw.replace(/^drafts\./, "") === SANITY_SINGLETON_HOMEPAGE_ID;
}

/**
 * Filter a list of schema options by name, honoring a caller `whitelist` or `blacklist`.
 * Shared by the field factories (media types, page-builder sections, rich-text blocks, icons)
 * so "pick which entries are allowed here" lives in one place instead of being copy-pasted.
 *
 * @param items - The full set of options.
 * @param getName - Reads an item's name; items with no name are always kept (they can't be
 *   targeted by name).
 * @param label - Factory name, used in the "both provided" error message.
 * @throws if both `whitelist` and `blacklist` are non-empty (mutually exclusive).
 */
export function selectByName<T, N extends string>(
  items: readonly T[],
  getName: (item: T) => N | null | undefined,
  { whitelist, blacklist, label }: { whitelist?: readonly N[]; blacklist?: readonly N[]; label: string }
): T[] {
  if (whitelist?.length && blacklist?.length) {
    throw new Error(`${label}: Cannot provide both whitelist and blacklist parameters.`);
  }

  return items.filter((item) => {
    const name = getName(item);

    if (!name) {
      return true;
    }

    if (whitelist?.length) {
      return whitelist.includes(name);
    }

    if (blacklist?.length) {
      return !blacklist.includes(name);
    }

    return true;
  });
}

// biome-ignore lint/suspicious/noExplicitAny: we don't know what the object is.
function dotPathToObjectValue<O extends Record<string, any>>(obj: O, path: string) {
  if (!path) {
    return obj;
  }

  return path.includes(".") ? path.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), obj) : obj[path];
}

/**
 * Returns a rule that hides a field if the value
 * of another field is not equal to the given value(s).
 * Falsy values are considered: e.g. visibleIf("showFilters")(false) shows when
 * showFilters is false or undefined.
 * @example
 * const visibleIfType = visibleIf("type");
 * visibleIfType("image"); // hides the field if the type is not "image"
 * visibleIfType(false);  // shows when the field is false or undefined
 */
export const visibleIf = (fieldName: string) => (value?: boolean | string | string[]) => ({
  hidden: ({ parent }: { parent: Record<string, unknown> }) => {
    const resolvedValue = parent ? dotPathToObjectValue(parent, fieldName) : undefined;
    const allowedValues = Array.isArray(value) ? value : [value];
    // When checking for boolean false, treat undefined as matching (falsy)
    const toMatch = allowedValues.length === 1 && allowedValues[0] === false ? [undefined, false] : allowedValues;
    return !toMatch.includes(resolvedValue as boolean | string);
  },
});

/**
 * Returns a rule that requires a field if the value
 * of another field is equal to the given value(s).
 * Falsy values are considered: e.g. requiredIf("showFilters")(false) requires when
 * the field is false or undefined.
 * @example
 * const requiredIfType = requiredIf("type");
 * requiredIfType("image"); // requires the field if the type is "image"
 * requiredIfType(false);  // requires when the other field is false or undefined
 */
export const requiredIf = (fieldName: string) => (value?: boolean | string | string[]) => {
  const allowedValues = Array.isArray(value) ? value : [value];
  const toMatch = allowedValues.length === 1 && allowedValues[0] === false ? [undefined, false] : allowedValues;

  return {
    validation: (R: unknown) => {
      return (R as Rule).custom((currentValue, { parent }) => {
        const resolvedValue = parent ? dotPathToObjectValue(parent, fieldName) : undefined;
        const conditionMatches = toMatch.includes(resolvedValue as boolean | string);
        return conditionMatches && currentValue === undefined ? "Required" : true;
      });
    },
  };
};

type ValidationBuilder<T> = (rule: T) => any;

export function isEmptyObjectValue(value: unknown) {
  return typeof value === "object" && value != null && !Array.isArray(value) && Object.values(value).every((v) => v == null);
}

export function requireTypeWhenObjectHasValue(message: string): ValidationBuilder<unknown> {
  return (R) =>
    (R as Rule).custom((value) => {
      if (!value || isEmptyObjectValue(value)) {
        return true;
      }

      return (value as { type?: string }).type ? true : message;
    });
}

export function composeValidation<T>(baseValidation: ValidationBuilder<T>, externalValidation?: ValidationBuilder<T>) {
  return (rule: T) => {
    const baseResult = baseValidation(rule);

    if (!externalValidation) {
      return baseResult;
    }

    const externalResult = externalValidation(rule);
    return Array.isArray(externalResult) ? [...externalResult, baseResult] : [externalResult, baseResult];
  };
}

type RefLike = { _ref?: string };

/**
 * Helpers for array-of-references fields: prevent duplicate refs in the dropdown and on save.
 * Use `.filter` in the reference's `options` and `.validation` on the array field.
 *
 * @param options.arrayKey - When the reference filter receives the parent object (e.g. section),
 *   the key that holds the array (e.g. `"items"`). Omit when parent is the array itself.
 * @param options.message - Validation error when duplicates are present.
 * @param options.required - When false, only the duplicate check runs (use with requiredIf etc.).
 *
 * @example
 * const uniqueStories = uniqueReferenceArray({
 *   arrayKey: "items",
 *   message: "Each story can only be added once to this grid.",
 * });
 * // In the array's of: [ defineArrayMember({ type: "reference", ..., options: { filter: uniqueStories.filter } }) ]
 * // On the array field: validation: (R) => uniqueStories.validation(R)
 */
export function uniqueReferenceArray(options?: { arrayKey?: string; message?: string; required?: boolean }) {
  const arrayKey = options?.arrayKey;
  const message = options?.message ?? "Each item can only be added once.";
  const required = options?.required !== false;

  const getRefs = (items: RefLike[] | undefined): string[] =>
    (items ?? []).map((item) => item?._ref).filter((ref): ref is string => Boolean(ref));

  const duplicateCheck = (value: unknown) => {
    const items = Array.isArray(value) ? (value as RefLike[]) : [];

    if (!items.length) {
      return true;
    }

    const refs = getRefs(items);
    const hasDuplicates = refs.some((id, index) => refs.indexOf(id) !== index);
    return hasDuplicates ? message : true;
  };

  return {
    filter: ({ parent }: { parent?: unknown }) => {
      const items = Array.isArray(parent)
        ? (parent as RefLike[])
        : arrayKey != null
          ? (parent as Record<string, RefLike[] | undefined>)?.[arrayKey]
          : undefined;

      const selected = getRefs(Array.isArray(items) ? items : undefined);

      if (!selected.length) {
        // Match-all GROQ filter: equivalent to "no filtering", but keeps the
        // return type a valid reference filter (Sanity rejects a boolean here).
        return { filter: "true" };
      }

      return { filter: "!(_id in $selected)", params: { selected } };
    },
    validation: (R: unknown) => {
      const rule = (R as Rule).custom(duplicateCheck);
      return required ? (R as Rule).required().custom(duplicateCheck) : rule;
    },
  };
}

/**
 * Extract an excerpt from a portable text object.
 * @param value - The Portable Text block to extract text from.
 * @param maxLength - The maximum length of the extracted text.
 * @returns The extracted text contents. Will return null if the block is empty.
 */
// biome-ignore lint/suspicious/noExplicitAny: the portable text block is too generic to type out.
export function createExcerptFromPortableText(value: any[], maxLength = 100) {
  const text = value.map(({ _type, children }) => {
    if (_type !== "block" || !children) {
      return "";
    }

    return children.map(({ text }: { text: string }) => text).join("");
  });

  if (!text?.length) {
    return "";
  }

  const joined = text.join(" ");
  return joined.length <= maxLength ? joined : `${joined.slice(0, maxLength)} …`;
}
