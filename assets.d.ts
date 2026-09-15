declare module "*.css" {
  const payload: string;
  export default payload;
}

declare module "*.jpg" {
  const payload: import("next/image").StaticImageData;
  export default payload;
}

declare module "*.png" {
  const payload: import("next/image").StaticImageData;
  export default payload;
}

declare module "*.jpeg" {
  const payload: import("next/image").StaticImageData;
  export default payload;
}

declare module "*.svg?url" {
  const payload: string;
  export default payload;
}

declare module "*.svg" {
  const payload: import("react").ComponentType<import("react").SVGProps<SVGSVGElement>>;
  export default payload;
}
