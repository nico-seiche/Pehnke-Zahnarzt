import { defineField } from "sanity";

export const testimonialHoursSection = defineField({
  type: "object",
  name: "testimonialHoursSection",
  title: "Testimonial + Opening Hours Section",
  icon: () => <>💬</>,
  fields: [
    defineField({
      name: "testimonial",
      type: "object",
      title: "Testimonial",
      validation: (R) => R.required(),
      fields: [
        defineField({ name: "quote", type: "text", rows: 3, validation: (R) => R.required() }),
        defineField({ name: "author", type: "string", validation: (R) => R.required() }),
        defineField({ name: "detail", type: "string", description: "E.g. “Patientin seit 2019”." }),
      ],
    }),
    defineField({
      name: "hoursTitle",
      type: "string",
      title: "Opening-hours card title",
      initialValue: "Öffnungszeiten",
    }),
  ],
  preview: {
    select: { title: "testimonial.author" },
    prepare: ({ title }) => ({ title: title ?? "Testimonial", subtitle: "Testimonial + Hours" }),
  },
});
