export const LinkFragment = `
  type,
  "openInNewTab": coalesce(openInNewTab, false),
  "canDownload": select(
    type == "file" => coalesce(canDownload, false),
    true => false
  ),
  "href": select(
    type == "internal" => coalesce(
      select(
        defined(internal.sectionTarget) && defined(internal.link->pageBuilder.sectionsArray) => internal.link->uri.current + '#' + coalesce(
          internal.link->pageBuilder.sectionsArray[_key == ^.internal.sectionTarget][0].sectionSettings.sectionHash.current,
          internal.link->pageBuilder.sectionsArray[_key == ^.internal.sectionTarget][0]._key,
        ),
        true => internal.link->uri.current,
      ),
      ""
    ),
    type == "external" => coalesce(external, ""),
    type == "email" => "mailto:" + coalesce(email, ""),
    type == "phone" => "tel:" + coalesce(phone, ""),
    type == "file" => coalesce(file.asset->url, ""),
    type == "params" => coalesce(paramsHref, ""),
    true => ""
  ),
  "text": coalesce(
    customText,
    select(
      type == "internal" => coalesce(
        select(
          defined(internal.sectionTarget) && defined(internal.link->pageBuilder.sectionsArray) => coalesce(
            internal.link->pageBuilder.sectionsArray[_key == ^.internal.sectionTarget][0].sectionSettings.sectionTitle,
            internal.link->title,
          ),
          true => internal.link->title,
        ),
        internal.link->uri.current,
        ""
      ),
      type == "external" => coalesce(external, ""),
      type == "email" => coalesce(email, ""),
      type == "phone" => coalesce(phone, ""),
      type == "file" => coalesce(file.asset->originalFilename, ""),
      type == "params" => coalesce(paramsHref, ""),
      true => ""
    ),
    "",
  )
`;

export type LinkFragmentResult = {
  type?: string;
  href: string;
  text: string;
  canDownload: boolean;
  openInNewTab: boolean;
};
