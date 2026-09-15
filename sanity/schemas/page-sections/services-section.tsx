import { defineArrayMember, defineField } from "sanity";
import { Icon, iconNames } from "../../../components/icon";
import { createIconField } from "../fields/create-icon";
import { createLinkField } from "../fields/create-link";

export const servicesSection = defineField({
  type: "object",
  name: "servicesSection",
  title: "Services Section",
  icon: () => <>🦷</>,
  fields: [
    defineField({ name: "eyebrow", type: "string", title: "Eyebrow" }),
    defineField({ name: "title", type: "string", title: "Title", validation: (R) => R.required().max(70) }),
    defineField({ name: "lead", type: "text", title: "Lead", rows: 2 }),
    defineField({
      name: "tone",
      type: "string",
      title: "Background",
      options: {
        list: [
          { title: "White", value: "page" },
          { title: "Light gray", value: "alt" },
        ],
      },
      initialValue: "alt",
    }),
    defineField({
      name: "items",
      type: "array",
      title: "Services",
      validation: (R) => R.required().min(1),
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            createIconField({ iconComponent: Icon, iconNames }),
            defineField({ name: "title", type: "string", validation: (R) => R.required() }),
            defineField({ name: "text", type: "text", rows: 2, validation: (R) => R.required().max(200) }),
            defineField({ name: "meta", type: "string", title: "Meta", description: "E.g. “60 Minuten” or “Kassenleistung”." }),
          ],
          preview: {
            select: { title: "title", subtitle: "meta" },
          },
        }),
      ],
    }),
    createLinkField({
      name: "link",
      title: "View-all link",
      description: "Optional link to a full services page.",
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title, subtitle: "Services" }),
  },
});
