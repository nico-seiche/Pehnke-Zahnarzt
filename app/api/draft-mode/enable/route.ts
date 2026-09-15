import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { sanityClient } from "~/features/sanity/client";

export const { GET } = defineEnableDraftMode({
  client: sanityClient,
});
