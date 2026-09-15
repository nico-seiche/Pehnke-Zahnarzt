export type CommonMediaProps = {
  // biome-ignore lint/suspicious/noExplicitAny: Could be any media component.
  ref?: React.RefObject<any>;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  aspectRatio?: number | string | null;
  // Only shared between video and animation components.
  loop?: boolean;
  autoPlay?: boolean;
};
