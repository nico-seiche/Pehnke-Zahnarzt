import { cx } from "~/features/style/utils";

export type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
  titleAs?: "h1" | "h2";
};

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  tone = "light",
  className,
  titleAs = "h2",
}: SectionHeadingProps) {
  const dark = tone === "dark";
  const Title = titleAs;

  return (
    <header
      className={cx(
        "reveal-group flex flex-col gap-16",
        align === "center" ? "mx-auto max-w-[720px] items-center text-center" : "max-w-[760px] items-start text-left",
        className
      )}
    >
      {eyebrow && <span className={cx("eyebrow", dark && "text-blue-300")}>{eyebrow}</span>}
      <Title className={cx("font-display text-h2", dark ? "text-white" : "text-text-heading")}>{title}</Title>
      {lead && <p className={cx("font-sans text-lead", dark ? "text-blue-100" : "text-text-muted")}>{lead}</p>}
    </header>
  );
}
