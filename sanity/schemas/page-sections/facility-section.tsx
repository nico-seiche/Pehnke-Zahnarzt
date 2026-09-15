import { defineArrayMember, defineField } from "sanity";
import { Icon, iconNames } from "../../../components/icon";
import { createIconField } from "../fields/create-icon";
import { createMediaField } from "../fields/create-media";

export const facilitySection = defineField({
  type: "object",
  name: "facilitySection",
  title: "Facility Section",
  icon: () => <>🏥</>,
  fields: [
    defineField({ name: "eyebrow", type: "string", title: "Eyebrow" }),
    defineField({ name: "title", type: "string", title: "Title", validation: (R) => R.required().max(70) }),
    defineField({ name: "lead", type: "text", title: "Lead", rows: 3 }),
    createMediaField({
      name: "image",
      title: "Image",
      whitelist: ["image"],
      validation: (R) => R.required(),
    }),
    defineField({
      name: "imagePosition",
      type: "string",
      title: "Image position",
      options: {
        list: [
          { title: "Left", value: "left" },
          { title: "Right", value: "right" },
        ],
      },
      initialValue: "left",
    }),
    defineField({
      name: "features",
      type: "array",
      title: "Features",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            createIconField({ iconComponent: Icon, iconNames }),
            defineField({ name: "text", type: "string", validation: (R) => R.required() }),
          ],
          preview: { select: { title: "text" } },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "title", media: "image.image" },
    prepare: ({ title, media }) => ({ title, subtitle: "Facility", media }),
  },
});
