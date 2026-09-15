import { defineField } from "sanity";
import { buildMediaPreview, createMediaField } from "../fields/create-media";

export const mediaSection = defineField({
  type: "object",
  name: "mediaSection",
  title: "Media Section",
  icon: () => <>🖼️</>,
  fields: [
    createMediaField({
      title: "Media",
      validation: (R) => R.required(),
      withCustomRatio: true,
      withCustomVideoOptions: true,
      options: {
        collapsed: false,
        collapsible: false,
      },
    }),
    defineField({
      name: "useParallax",
      type: "boolean",
      title: "Use Parallax",
      initialValue: false,
      description: "Apply a scroll-driven parallax effect to the media.",
    }),
    defineField({
      name: "caption",
      type: "text",
      rows: 2,
      description: "Add a caption for the media.",
    }),
  ],
  preview: {
    select: {
      type: "appMedia.type",
      image: "appMedia.image",
      playbackId: "appMedia.video.asset.playbackId",
      thumbTime: "appMedia.video.asset.thumbTime",
      videoCoverUrl: "appMedia.videoCover.asset.url",
    },
    prepare: (props) => {
      return {
        ...buildMediaPreview(props),
        subtitle: "Media",
      };
    },
  },
});
