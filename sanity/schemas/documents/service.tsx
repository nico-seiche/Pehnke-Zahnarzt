import { defineField, defineType } from "sanity";
import { Icon, iconNames } from "../../../components/icon";
import { createIconField } from "../fields/create-icon";

export const service = defineType({
  name: "service",
  type: "document",
  title: "Leistung",
  icon: () => <>🦷</>,
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Titel",
      validation: (R) => R.required(),
    }),
    defineField({
      name: "category",
      type: "string",
      title: "Kategorie",
      description: "Bestimmt, in welcher Gruppe die Leistung auf der Leistungen-Seite erscheint.",
      options: {
        list: [
          { title: "Kassenleistung", value: "kasse" },
          { title: "Selbstzahlerleistung", value: "selbstzahler" },
        ],
        layout: "radio",
      },
      validation: (R) => R.required(),
    }),
    createIconField({ iconComponent: Icon, iconNames }),
    defineField({
      name: "text",
      type: "text",
      title: "Beschreibung",
      rows: 3,
      validation: (R) => R.required().max(220),
    }),
    defineField({
      name: "meta",
      type: "string",
      title: "Zusatzinfo",
      description: "Kurzer Hinweis, z. B. „60 Minuten“, „inkl. Nachsorge“ oder „Kassenleistung“.",
    }),
    defineField({
      name: "order",
      type: "number",
      title: "Reihenfolge",
      description: "Kleinere Zahl erscheint weiter oben. Leer lassen für alphabetische Sortierung nach Titel.",
    }),
  ],
  orderings: [
    {
      title: "Reihenfolge",
      name: "orderAsc",
      by: [
        { field: "order", direction: "asc" },
        { field: "title", direction: "asc" },
      ],
    },
  ],
  preview: {
    select: {
      title: "title",
      category: "category",
      meta: "meta",
    },
    prepare: ({ title, category, meta }) => ({
      title,
      subtitle: [category === "kasse" ? "Kassenleistung" : "Selbstzahlerleistung", meta].filter(Boolean).join(" · "),
    }),
  },
});
