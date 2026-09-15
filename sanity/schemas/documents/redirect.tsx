import { defineField, defineType } from "sanity";

const redirectStatus = {
  301: "301 (Permanent)",
  302: "302 (Temporary)",
};

export const redirect = defineType({
  __experimental_formPreviewTitle: false,
  name: "redirect",
  type: "document",
  title: "Redirect",
  icon: () => <>⤮</>,
  fields: [
    defineField({
      name: "from",
      type: "string",
      title: "From",
      description: 'The original path (e.g., "/old-page").',
      validation: (R) => {
        return R.required().custom((value, { parent }) => {
          if (!value) {
            return true;
          }

          if (!value.startsWith("/")) {
            return 'Path must start with a "/" (e.g., "/about").';
          }

          // @ts-expect-error The prop is part of the redirect schema.
          if (value === parent?.to) {
            return 'The "From" and "To" paths cannot be the same.';
          }

          return true;
        });
      },
    }),
    defineField({
      name: "to",
      type: "string",
      title: "To",
      description: 'The destination path (e.g., "/new-page").',
      validation: (R) => {
        return R.required().custom((value, { parent }) => {
          if (!value) {
            return true;
          }

          if (!value.startsWith("/")) {
            return 'Path must start with a "/" (e.g., "/about").';
          }

          // @ts-expect-error The prop is part of the redirect schema.
          if (value === parent?.from) {
            return 'The "To" and "From" paths cannot be the same.';
          }

          return true;
        });
      },
    }),
    defineField({
      name: "statusCode",
      type: "number",
      title: "Kind",
      validation: (R) => R.required(),
      initialValue: 301,
      options: {
        list: Object.entries(redirectStatus).map(([value, title]) => ({
          title,
          value: Number(value),
        })),
      },
    }),
  ],
  preview: {
    select: {
      to: "to",
      from: "from",
      statusCode: "statusCode",
    },
    prepare: ({ from, to, statusCode }) => {
      return {
        title: `${from} -> ${to}`,
        subtitle: redirectStatus[statusCode as keyof typeof redirectStatus],
      };
    },
  },
});
