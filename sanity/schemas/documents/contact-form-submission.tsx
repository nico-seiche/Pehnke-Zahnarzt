import { defineField, defineType } from "sanity";

export const contactFormSubmission = defineType({
  __experimental_formPreviewTitle: false,
  name: "contactFormSubmission",
  type: "document",
  readOnly: true,
  icon: () => <>📧</>,
  fields: [
    defineField({
      name: "firstName",
      type: "string",
    }),
    defineField({
      name: "lastName",
      type: "string",
    }),
    defineField({
      name: "email",
      type: "string",
    }),
    defineField({
      name: "message",
      type: "text",
      rows: 5,
    }),
  ],
  preview: {
    select: {
      email: "email",
      createdAt: "_createdAt",
    },
    prepare: ({ email, createdAt }) => {
      return {
        title: email,
        subtitle: createdAt,
      };
    },
  },
});
