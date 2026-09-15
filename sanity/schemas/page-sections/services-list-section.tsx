import { defineField } from "sanity";

export const servicesListSection = defineField({
  type: "object",
  name: "servicesListSection",
  title: "Services List Section",
  icon: () => <>🦷</>,
  description:
    "Shows every published “Leistung” document, grouped into Kassenleistungen and Selbstzahlerleistungen. Manage the individual services under “Leistungen” in the sidebar, not here.",
  fields: [
    defineField({ name: "eyebrow", type: "string", title: "Eyebrow" }),
    defineField({ name: "title", type: "string", title: "Title", validation: (R) => R.required().max(70) }),
    defineField({ name: "lead", type: "text", title: "Lead", rows: 2 }),
    defineField({
      name: "infoNote",
      type: "text",
      title: "Info note",
      rows: 2,
      description: "Optional short note shown at the top, e.g. about accepted insurance types.",
    }),
    defineField({
      name: "selbstzahlerLead",
      type: "text",
      title: "Selbstzahler lead",
      rows: 2,
      description: "Optional short paragraph under the “Selbstzahlerleistungen” heading.",
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title, subtitle: "Services List" }),
  },
});
