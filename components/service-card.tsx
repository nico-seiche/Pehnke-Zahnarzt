import { Icon, type IconName } from "~/components/icon";

export type ServiceCardProps = {
  icon?: IconName | null;
  title: string;
  text?: string | null;
  meta?: string | null;
};

export function ServiceCard({ icon, title, text, meta }: ServiceCardProps) {
  return (
    <div className="flex h-full flex-col items-start gap-16 border-border-subtle border-r border-b p-32 lg:p-40">
      <span className="flex size-64 items-center justify-center rounded-full bg-paper-300 text-brand-strong lg:size-72">
        {icon && <Icon name={icon} className="text-[26px]" />}
      </span>
      <h3 className="font-display font-medium text-h3 text-text-heading">{title}</h3>
      {text && <p className="font-sans text-small text-text-muted leading-relaxed">{text}</p>}
      {meta && <span className="font-sans text-brand-strong text-label tracking-[0.02em]">{meta}</span>}
      <span aria-hidden className="mt-auto pt-8 text-text-subtle">
        <Icon name="arrow-right" className="text-[18px]" />
      </span>
    </div>
  );
}
