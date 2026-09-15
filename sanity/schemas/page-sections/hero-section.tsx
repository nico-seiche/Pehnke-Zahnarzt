import { defineArrayMember, defineField } from "sanity";
import { Icon, iconNames } from "../../../components/icon";
import { createIconField } from "../fields/create-icon";
import { createLinkField } from "../fields/create-link";
import { createMediaField } from "../fields/create-media";

export const heroSection = defineField({
  type: "object",
  name: "heroSection",
  title: "Hero Section",
  icon: () => <>🏠</>,
  fields: [
    defineField({
      name: "eyebrow",
      type: "string",
      title: "Eyebrow",
      description: "Small label above the headline, e.g. “Zahnarztpraxis in Witten”.",
    }),
    defineField({
      name: "headline",
      type: "string",
      title: "Headline",
      validation: (R) => R.required().max(70),
    }),
    defineField({
      name: "lead",
      type: "text",
      title: "Lead",
      rows: 3,
      validation: (R) => R.max(220),
    }),
    createLinkField({
      name: "primaryCta",
      title: "Primary CTA",
      validation: (R) => R.required(),
    }),
    createLinkField({
      name: "secondaryCta",
      title: "Secondary CTA",
    }),
    defineField({
      name: "trustBadges",
      type: "array",
      title: "Trust Badges",
      description: "Small badges under the CTAs, e.g. “Neupatienten willkommen”.",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            createIconField({ iconComponent: Icon, iconNames }),
            defineField({ name: "text", type: "string", validation: (R) => R.required() }),
            defineField({
              name: "tone",
              type: "string",
              title: "Tone",
              options: { list: ["brand", "success", "mint"] },
              initialValue: "brand",
            }),
          ],
          preview: {
            select: { title: "text", subtitle: "appIcon" },
          },
        }),
      ],
    }),
    createMediaField({
      name: "image",
      title: "Hero Image",
      whitelist: ["image"],
      validation: (R) => R.required(),
    }),
    defineField({
      name: "showTodayCard",
      type: "boolean",
      title: "Show opening-hours card",
      description: "Shows a floating card with today's opening hours and the phone number, over the hero image.",
      initialValue: true,
      options: { layout: "switch" },
    }),
  ],
  preview: {
    select: {
      headline: "headline",
      media: "image.image",
    },
    prepare: ({ headline, media }) => ({
      title: headline,
      subtitle: "Hero",
      media,
    }),
  },
});
