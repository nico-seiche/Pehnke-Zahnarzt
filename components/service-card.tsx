import { Card } from "~/components/card";
import { Icon, type IconName } from "~/components/icon";

export type ServiceCardProps = {
  icon?: IconName | null;
  title: string;
  text?: string | null;
  meta?: string | null;
};

export function ServiceCard({ icon, title, text, meta }: ServiceCardProps) {
  return (
    <Card className="flex flex-col items-start gap-16">
      <span className="flex size-46 items-center justify-center rounded-md bg-brand-soft text-brand-strong">
        {icon && <Icon name={icon} className="text-[22px]" />}
      </span>
      <h3 className="font-display text-h3 text-text-heading">{title}</h3>
      {text && <p className="font-sans text-small text-text-muted leading-relaxed">{text}</p>}
      {meta && <span className="font-sans text-brand-strong text-label tracking-[0.02em]">{meta}</span>}
    </Card>
  );
}
