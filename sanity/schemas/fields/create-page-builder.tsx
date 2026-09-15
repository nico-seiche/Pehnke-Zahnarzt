import * as changeCase from "change-case";
import type { ArrayOfObjectsInputProps, ArrayRule, ObjectOptions, PathSegment, ValidationBuilder } from "sanity";
import { defineArrayMember, defineField } from "sanity";
import { composeValidation, selectByName } from "../../utils";
import { sections } from "../page-sections";

type SectionName = (typeof sections)[number]["name"];

function wrapSectionName(name: SectionName) {
  return `${name}Field`;
}

function unwrapSectionName(name: string) {
  return name.replace("Field", "") as SectionName;
}

function mapPreviewSelect(select: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(select).map(([key, path]) => {
      return [key, `sectionContent.${path}`];
    })
  );
}

function isSectionSegment(path?: PathSegment): path is { _key: string } {
  return Boolean(typeof path === "object" && "_key" in path);
}

function getCountsByType(value: unknown[] | undefined): Record<string, number> {
  const counts: Record<string, number> = {};

  if (!Array.isArray(value)) {
    return counts;
  }

  for (const item of value) {
    const type = (item as { _type?: string })?._type;

    if (type) {
      counts[type] = (counts[type] ?? 0) + 1;
    }
  }

  return counts;
}

export function PageBuilderSectionsArrayInput(props: ArrayOfObjectsInputProps) {
  const fieldOptions = props.schemaType?.options as { sectionMaxCount?: Record<string, number> } | undefined;
  const sectionMaxCount = fieldOptions?.sectionMaxCount;

  if (!sectionMaxCount || Object.keys(sectionMaxCount).length === 0) {
    return props.renderDefault(props);
  }

  const baseSchemaType = props.schemaType;

  if (!baseSchemaType || !Array.isArray(baseSchemaType.of)) {
    return props.renderDefault(props);
  }

  const counts = getCountsByType(props.value as unknown[]);
  const ofTypes = baseSchemaType.of;

  const availableTypes = ofTypes.filter((memberType) => {
    const typeName = (memberType as { name?: string })?.name;

    if (!typeName) {
      return true;
    }

    const sectionName = unwrapSectionName(typeName);
    const max = sectionMaxCount[sectionName];

    // If no limit is defined for this section, it's always available
    if (max === undefined) {
      return true;
    }

    // The count is based on the array item's _type, which matches typeName
    const count = counts[typeName] ?? 0;
    return count < max;
  });

  // Sanity's array + insert menu assume a non-empty `of` when the add UI is shown.
  // When every limited section is at max, the filter would yield `[]` and crash the Studio.
  // Fall back to the full member list; `sectionsArrayValidation` still blocks saving over the limit.
  const of = availableTypes.length > 0 ? availableTypes : ofTypes;

  const canInsertSection = availableTypes.length > 0;
  const baseOptions = (baseSchemaType.options ?? {}) as {
    disableActions?: string[];
    sectionMaxCount?: Record<string, number>;
    insertMenu?: unknown;
    [key: string]: unknown;
  };

  const mergedOptions = {
    ...baseOptions,
    ...(canInsertSection
      ? {}
      : {
          disableActions: Array.from(new Set([...(baseOptions.disableActions ?? []), "add"])),
        }),
  };

  return props.renderDefault({
    ...props,
    schemaType: {
      ...baseSchemaType,
      of,
      options: mergedOptions as (typeof baseSchemaType)["options"],
    },
  });
}

const sectionSettings = defineField({
  type: "object",
  group: "settings",
  name: "sectionSettings",
  fields: [
    defineField({
      type: "string",
      name: "sectionTitle",
      description: "Used internally to identify the section.",
    }),
    defineField({
      type: "slug",
      name: "sectionHash",
      title: "Section Hash",
      description: "Used to link to this section.",
      options: {
        isUnique: (input, { document, path }) => {
          // @ts-expect-error Its our page builder field.
          const array = document?.pageBuilder?.sectionsArray;

          if (!array?.length) {
            return true;
          }

          const activeItem = path?.find(isSectionSegment);

          const otherHashes: string[] = array
            .filter((el: { _key: string }) => !activeItem || activeItem._key !== el._key)
            // biome-ignore lint/suspicious/noExplicitAny: its our page builder.
            .map((el: any) => el.sectionSettings?.sectionHash?.current)
            .filter(Boolean);

          return !otherHashes.some((el) => input === el);
        },
        source: (_, { parent, parentPath }) => {
          const key = parentPath?.find(isSectionSegment)?._key ?? "";
          // @ts-expect-error The link field refers to the parent and exists.
          const sectionHash = parent?.sectionTitle ? changeCase.kebabCase(parent.sectionTitle) : key;
          return sectionHash;
        },
      },
    }),
  ],
});

// Convert all sections to array member fields.
// This will wrap the actual section content in a new
// object field and add the generic section settings.
const sectionFields = sections.map((section) => {
  const sectionTitle = changeCase.capitalCase(section.name.replace("Section", ""));
  const sectionSelect = (section.preview as { select?: Record<string, string> } | undefined)?.select ?? {};

  return defineArrayMember({
    type: "object",
    name: wrapSectionName(section.name),
    title: sectionTitle,
    icon: section.icon,
    groups: [
      { name: "default", title: "Content", icon: () => <>📄</>, default: true },
      { name: "settings", title: "Settings", icon: () => <>⚙</> },
    ],
    fields: [
      sectionSettings,
      defineField({
        type: section.name as string,
        group: "default",
        name: "sectionContent",
      }),
    ],
    preview: {
      select: {
        sectionTitle: "sectionSettings.sectionTitle",
        ...mapPreviewSelect(sectionSelect),
      },
      prepare: (selection) => {
        const { sectionTitle: customTitle, ...sectionSelection } = selection as {
          sectionTitle?: string;
          [key: string]: unknown;
        };

        // Try to get preview from the section's own preview config
        // biome-ignore lint/suspicious/noExplicitAny: its our page builder.
        const sectionPreview = section.preview as any;

        if (sectionPreview?.prepare) {
          const preparedPreview = sectionPreview.prepare(sectionSelection);

          return {
            title: customTitle ?? preparedPreview.title ?? sectionTitle,
            subtitle: preparedPreview.subtitle ?? sectionTitle,
            media: preparedPreview.media ?? section.icon,
          };
        }

        return {
          title: customTitle ?? sectionTitle,
          subtitle: sectionTitle,
          media: section.icon,
        };
      },
    },
  });
});

export function createPageBuilderField({
  group,
  options,
  whitelist,
  blacklist,
  sectionMaxCount,
  validation,
  name = "pageBuilder",
  title = "Page Builder",
  description = "Drag & drop sections to build your page.",
  thumbnailBaseUrl = "/page-builder-section-thumbs",
}: {
  name?: string;
  title?: string;
  group?: string;
  description?: string;
  options?: ObjectOptions;
  whitelist?: SectionName[];
  blacklist?: SectionName[];
  /** Max number of times each section can be used in this page builder. E.g. { mediaSectionField: 1 }. */
  sectionMaxCount?: Partial<Record<SectionName, number>>;
  /** Not under `NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH`: that prefix is rewritten to the Studio app before `public/` files. */
  thumbnailBaseUrl?: string;
  validation?: ValidationBuilder<ArrayRule<unknown[]>, unknown[]>;
} = {}) {
  const enabledSections = selectByName(sectionFields, (schema) => (schema.name ? unwrapSectionName(schema.name) : undefined), {
    whitelist,
    blacklist,
    label: "createPageBuilderField",
  });

  const sectionLimits = sectionMaxCount && Object.keys(sectionMaxCount).length > 0 ? sectionMaxCount : null;

  const sectionsArrayValidation: ValidationBuilder<ArrayRule<unknown[]>, unknown[]> = (R) => {
    let rule = R.min(1);

    if (sectionLimits) {
      rule = rule.custom((arrayValue) => {
        if (!Array.isArray(arrayValue)) {
          return true;
        }

        const counts: Record<string, number> = {};

        for (const item of arrayValue) {
          const type = (item as { _type?: string })?._type;

          if (type) {
            counts[type] = (counts[type] ?? 0) + 1;
          }
        }

        for (const [sectionName, max] of Object.entries(sectionLimits)) {
          const fieldType = wrapSectionName(sectionName as SectionName);
          const count = counts[fieldType] ?? 0;

          if (count > max) {
            const label = changeCase.capitalCase(sectionName.replace("Section", ""));
            return `${label} can be used at most ${max} time(s). Currently used ${count} time(s).`;
          }
        }

        return true;
      });
    }

    return composeValidation((rule: ArrayRule<unknown[]>) => rule, validation)(rule);
  };

  return defineField({
    type: "object",
    name,
    title,
    group,
    description,
    options,
    fields: [
      defineField({
        name: "sectionsArray",
        type: "array",
        title: "Sections",
        validation: sectionsArrayValidation,
        of: enabledSections,
        ...(sectionLimits && { components: { input: PageBuilderSectionsArrayInput } }),
        options: {
          ...(sectionLimits && { sectionMaxCount: sectionLimits }),
          insertMenu: {
            filter: true,
            views: [
              {
                name: "grid",
                previewImageUrl: (name) => {
                  const sectionName = unwrapSectionName(name);
                  const sectionThumb = changeCase.kebabCase(sectionName);
                  return `${thumbnailBaseUrl}/${sectionThumb}.jpg`;
                },
              },
            ],
          },
        },
      }),
    ],
    preview: {
      prepare() {
        return {
          title: "Page Builder",
        };
      },
    },
  });
}
