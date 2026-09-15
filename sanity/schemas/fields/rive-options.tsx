import { defineField } from "sanity";

export const riveOptions = defineField({
  name: "riveOptions",
  type: "object",
  title: "Rive Options",
  description: "Configure Rive playback.",
  icon: () => <>🎚️</>,
  options: {
    collapsed: false,
    collapsible: true,
  },
  fields: [
    defineField({
      name: "loop",
      type: "boolean",
      title: "Loop",
      description: "Play on a loop.",
    }),
    defineField({
      name: "autoPlay",
      type: "boolean",
      title: "Auto Play",
      description: "Start automatically when in view.",
    }),
  ],
});
