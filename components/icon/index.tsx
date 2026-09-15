import type * as React from "react";
import { cx } from "~/features/style/utils";
import IconAccessibility from "./icon-accessibility.svg";
import IconActivity from "./icon-activity.svg";
import IconAlertCircle from "./icon-alert-circle.svg";
import IconAlertTriangle from "./icon-alert-triangle.svg";
import IconAnchor from "./icon-anchor.svg";
import IconArrowDown from "./icon-arrow-down.svg";
import IconArrowLeft from "./icon-arrow-left.svg";
import IconArrowRight from "./icon-arrow-right.svg";
import IconArrowUp from "./icon-arrow-up.svg";
import IconArrowUpRight from "./icon-arrow-up-right.svg";
import IconBaby from "./icon-baby.svg";
import IconCalendarCheck from "./icon-calendar-check.svg";
import IconCar from "./icon-car.svg";
import IconCheck from "./icon-check.svg";
import IconCheckCircle from "./icon-check-circle.svg";
import IconChevronRight from "./icon-chevron-right.svg";
import IconCircleAlert from "./icon-circle-alert.svg";
import IconCircleCheck from "./icon-circle-check.svg";
import IconClock from "./icon-clock.svg";
import IconInfo from "./icon-info.svg";
import IconLanguages from "./icon-languages.svg";
import IconMail from "./icon-mail.svg";
import IconMenu from "./icon-menu.svg";
import IconMoon from "./icon-moon.svg";
import IconPhone from "./icon-phone.svg";
import IconScan from "./icon-scan.svg";
import IconShieldCheck from "./icon-shield-check.svg";
import IconSmile from "./icon-smile.svg";
import IconSparkles from "./icon-sparkles.svg";
import IconSun from "./icon-sun.svg";
import IconTriangleAlert from "./icon-triangle-alert.svg";
import IconUser from "./icon-user.svg";
import IconX from "./icon-x.svg";

export type IconName = keyof typeof icons;

const icons = {
  accessibility: IconAccessibility,
  activity: IconActivity,
  "alert-circle": IconAlertCircle,
  "alert-triangle": IconAlertTriangle,
  anchor: IconAnchor,
  "arrow-right": IconArrowRight,
  "arrow-left": IconArrowLeft,
  "arrow-up": IconArrowUp,
  "arrow-down": IconArrowDown,
  "arrow-up-right": IconArrowUpRight,
  baby: IconBaby,
  "calendar-check": IconCalendarCheck,
  car: IconCar,
  check: IconCheck,
  "check-circle": IconCheckCircle,
  "chevron-right": IconChevronRight,
  "circle-alert": IconCircleAlert,
  "circle-check": IconCircleCheck,
  clock: IconClock,
  info: IconInfo,
  languages: IconLanguages,
  mail: IconMail,
  menu: IconMenu,
  moon: IconMoon,
  phone: IconPhone,
  scan: IconScan,
  "shield-check": IconShieldCheck,
  smile: IconSmile,
  sparkles: IconSparkles,
  sun: IconSun,
  "triangle-alert": IconTriangleAlert,
  user: IconUser,
  x: IconX,
} as const;

export const iconNames = Object.keys(icons) as IconName[];

export function Icon(
  props: React.ComponentProps<"svg"> & {
    name: IconName;
  }
) {
  const { name, className, ...rest } = props;
  const Component = icons[name];

  if (!Component) {
    return null;
  }

  return <Component aria-hidden className={cx("size-[1em] shrink-0", className)} {...rest} />;
}
