import { defineField } from "sanity";
import { createLinkField } from "../fields/create-link";

export const ctaBandSection = defineField({
  type: "object",
  name: "ctaBandSection",
  title: "CTA Band Section",
  icon: () => <>📣</>,
  fields: [
    defineField({ name: "title", type: "string", title: "Title", validation: (R) => R.required().max(70) }),
    defineField({ name: "text", type: "text", title: "Text", rows: 2 }),
    createLinkField({
      name: "primaryCta",
      title: "Primary CTA",
      validation: (R) => R.required(),
    }),
    createLinkField({
      name: "secondaryCta",
      title: "Secondary CTA",
      description: "Optional, e.g. a phone number link.",
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title, subtitle: "CTA Band" }),
  },
});
