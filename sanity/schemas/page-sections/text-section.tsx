import { defineField } from "sanity";
import { createRichTextField } from "../fields/create-rich-text";

export const textSection = defineField({
  type: "object",
  name: "textSection",
  title: "Text",
  icon: () => <>📝</>,
  fields: [
    createRichTextField({
      variant: "full",
      title: "Text",
      validation: (R) => R.required(),
    }),
  ],
  preview: {
    prepare() {
      return {
        title: "Text",
      };
    },
  },
});
