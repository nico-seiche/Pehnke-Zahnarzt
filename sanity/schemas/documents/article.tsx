import { defineArrayMember, defineField, defineType } from "sanity";
import { uniqueReferenceArray } from "../../utils";
import { createAgentMarkdownField } from "../fields/create-agent-markdown-field";
import { createPageBuilderField } from "../fields/create-page-builder";
import { createSeoField } from "../fields/create-seo-field";
import { createUriField } from "../fields/create-uri-field";

const uniqueCategories = uniqueReferenceArray({
  arrayKey: "categories",
  message: "Each category can only be selected once. Remove duplicate selections.",
});

export const article = defineType({
  __experimental_formPreviewTitle: false,
  name: "article",
  type: "document",
  title: "Article",
  icon: () => <>📄</>,
  groups: [
    { name: "page", title: "Page", icon: () => <>📄</>, default: true },
    { name: "content", title: "Content", icon: () => <>🍱</> },
    { name: "seo", title: "SEO", icon: () => <>🔍</> },
    { name: "agents", title: "Agents", icon: () => <>🤖</> },
  ],
  fields: [
    defineField({
      group: "page",
      name: "title",
      type: "string",
      title: "Title",
      validation: (R) => R.required(),
    }),
    createUriField({
      group: "page",
      source: "title",
      slugify: ({ slug }) => `/articles/${slug}`,
      validation: (R) => R.required(),
    }),
    defineField({
      group: "page",
      name: "passwordProtected",
      type: "boolean",
      title: "Password protect",
      description:
        "When “Protect entire site” is off, only this URL requires Basic Auth (same BASIC_AUTH_* env credentials as site-wide). When site-wide protection is on, this is redundant. Takes effect on Publish (not on save), within about five minutes.",
      initialValue: false,
      options: { layout: "switch" },
    }),
    defineField({
      group: "page",
      name: "showHeader",
      type: "boolean",
      title: "Show site header",
      description: "Renders the site header (navigation) on this page.",
      initialValue: true,
      options: { layout: "switch" },
    }),
    defineField({
      group: "page",
      name: "showFooter",
      type: "boolean",
      title: "Show site footer",
      description: "Renders the site footer on this page.",
      initialValue: true,
      options: { layout: "switch" },
    }),
    defineField({
      name: "categories",
      type: "array",
      title: "Categories",
      description: "The categories of the article.",
      group: "content",
      of: [
        defineArrayMember({
          type: "reference",
          title: "Category",
          to: [{ type: "articleCategory", validation: (R) => R.required() }],
          options: { filter: uniqueCategories.filter },
        }),
      ],
      validation: (R) => uniqueCategories.validation(R),
    }),
    defineField({
      name: "publishedAt",
      type: "date",
      title: "Published At",
      validation: (R) => R.required(),
      group: "content",
    }),
    defineField({
      name: "author",
      type: "string",
      title: "Author",
      group: "content",
    }),
    defineField({
      name: "image",
      type: "image",
      title: "Image",
      options: {
        hotspot: true,
        collapsed: false,
        collapsible: false,
        accept: "image/*",
      },
      validation: (R) => R.required(),
      group: "content",
    }),
    createPageBuilderField({
      group: "content",
    }),
    createSeoField({
      group: "seo",
    }),
    createAgentMarkdownField({
      group: "agents",
    }),
  ],
  preview: {
    select: {
      title: "title",
      publishedAt: "publishedAt",
      author: "author",
      image: "image",
    },
    prepare({ title, publishedAt, author, image }) {
      return {
        title,
        subtitle: `${publishedAt} by ${author}`,
        media: image,
      };
    },
  },
});
