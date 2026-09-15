import { defineArrayMember, defineField } from "sanity";
import { createMediaField } from "../fields/create-media";

export const teamSection = defineField({
  type: "object",
  name: "teamSection",
  title: "Team Section",
  icon: () => <>🧑‍⚕️</>,
  fields: [
    defineField({ name: "eyebrow", type: "string", title: "Eyebrow" }),
    defineField({ name: "title", type: "string", title: "Title", validation: (R) => R.required().max(70) }),
    defineField({ name: "lead", type: "text", title: "Lead", rows: 2 }),
    defineField({
      name: "members",
      type: "array",
      title: "Team members",
      validation: (R) => R.required().min(1),
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({ name: "name", type: "string", validation: (R) => R.required() }),
            defineField({ name: "role", type: "string", title: "Role", validation: (R) => R.required() }),
            defineField({ name: "focus", type: "string", title: "Focus", description: "E.g. “Prophylaxe, Parodontologie”." }),
            createMediaField({
              name: "photo",
              title: "Photo",
              whitelist: ["image"],
            }),
          ],
          preview: {
            select: { title: "name", subtitle: "role", media: "photo.image" },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare: ({ title }) => ({ title, subtitle: "Team" }),
  },
});
