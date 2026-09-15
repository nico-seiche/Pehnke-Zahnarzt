import type * as React from "react";
import { preload } from "react-dom";
import { parseResponsiveValues } from "~/features/dom/utils";

function createResponsiveSizes(sizes: string) {
  let defaultValue = "100vw";

  const queries = Object.entries(parseResponsiveValues(sizes)).map(([bp, { value, resolvedWidth }]) => {
    if (bp === "DEFAULT") {
      defaultValue = value;
      return null;
    }

    return `(min-width: ${resolvedWidth}) ${value}`;
  });

  const validQueries = queries.filter(Boolean);
  return validQueries.length ? `${validQueries.join(", ")}, ${defaultValue}` : defaultValue;
}

function Image({
  sizes,
  src,
  srcSet,
  priority,
  alt = "",
  loading = priority ? "eager" : "lazy",
  decoding = loading === "lazy" ? "async" : "auto",
  fetchPriority,
  ...props
}: Omit<React.ComponentProps<"img">, "sizes" | "src"> & {
  src: string;
  sizes?: string;
  priority?: boolean;
}) {
  const responsiveSizes = sizes ? createResponsiveSizes(sizes) : undefined;

  if (priority) {
    // imageSrcSet/imageSizes keep the preload on the same candidate the <img> picks,
    // otherwise the browser downloads both the preloaded src and the srcset match.
    preload(src, {
      as: "image",
      fetchPriority: "high",
      imageSrcSet: srcSet,
      imageSizes: srcSet ? responsiveSizes : undefined,
    });
  }

  return (
    <img
      // The order of the props is important to avoid lazy loading issues.
      // @see https://github.com/vercel/next.js/blob/canary/packages/next/src/client/image-component.tsx#L262
      loading={loading}
      decoding={decoding}
      alt={alt}
      src={src}
      srcSet={srcSet}
      sizes={responsiveSizes}
      {...props}
      fetchPriority={priority ? "high" : fetchPriority}
    />
  );
}

export { createResponsiveSizes, Image };
