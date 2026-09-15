import { MediaFragment, type MediaFragmentResult } from "~/features/sanity/media/fragment";

export const MediaBlockFragment = `
_type == "mediaBlock" => {
  caption,
  useParallax,
  "media": appMedia{${MediaFragment}},
}
`;

export type MediaBlockFragmentResult = {
  caption?: string;
  useParallax?: boolean;
  media?: MediaFragmentResult;
};
