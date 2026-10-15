import { Icon, type IconName } from "~/components/icon";

export type ServiceCardProps = {
  icon?: IconName | null;
  title: string;
  text?: string | null;
  bullets?: (string | null)[] | null;
  meta?: string | null;
};

export function ServiceCard({ icon, title, text, bullets, meta }: ServiceCardProps) {
  const bulletItems = bullets?.filter((b): b is string => Boolean(b)) ?? [];

  return (
    <div className="flex h-full flex-col items-start gap-16 border-border-subtle border-r border-b p-32 lg:p-40">
      <span className="flex size-64 items-center justify-center rounded-full bg-chip text-brand-strong lg:size-72">
        {icon && <Icon name={icon} className="text-[26px]" />}
      </span>
      <h3 className="font-display font-medium text-h3 text-text-heading">{title}</h3>
      {bulletItems.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-4 p-0 font-sans text-small text-text-muted leading-relaxed">
          {bulletItems.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : (
        text && <p className="font-sans text-small text-text-muted leading-relaxed">{text}</p>
      )}
      {meta && <span className="font-sans text-brand-strong text-label tracking-[0.02em]">{meta}</span>}
      <span aria-hidden className="mt-auto pt-8 text-text-subtle">
        <Icon name="arrow-right" className="text-[18px]" />
      </span>
    </div>
  );
}
