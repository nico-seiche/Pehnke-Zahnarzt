import type { SanityImageCrop, SanityImageDimensions, SanityImageHotspot } from "~/sanity/types";

export const ImageFragment = `
  "_id": asset->._id,
  "_rev": asset->._rev,
  "altText": asset->.altText,
  "description": asset->.description,
  "title": asset->.title,
  "lqip": asset->.metadata.lqip,
  "dimensions": asset->.metadata.dimensions,
  crop,
  hotspot,
`;

export type ImageFragmentResult = {
  _id?: string;
  _rev?: string;
  altText?: string;
  description?: string;
  title?: string;
  lqip?: string;
  dimensions?: SanityImageDimensions | null;
  crop?: SanityImageCrop | null;
  hotspot?: SanityImageHotspot | null;
};

export const VideoFragment = `
  "_id": asset->_id,
  "_rev": asset->_rev,
  "playbackId": asset->playbackId,
  "thumbTime": coalesce(asset->thumbTime, 1),
  "duration": asset->data.duration,
  "dimensions": {
    "width": asset->data.tracks[0].max_width,
    "height": asset->data.tracks[0].max_height,
    "aspectRatio": asset->data.tracks[0].max_width / asset->data.tracks[0].max_height,
  }
`;

export type VideoFragmentResult = {
  _id?: string;
  _rev?: string;
  playbackId?: string;
  thumbTime?: number;
  duration?: number;
  dimensions?: {
    width?: number;
    height?: number;
    aspectRatio?: number;
  };
};

export const MediaFragment = `
videoOptions{
  loop,
  muted,
  autoPlay,
  "noControls": !controls,
},
lottieOptions{
  loop,
  autoPlay,
},
riveOptions{
  loop,
  autoPlay,
},
...select(
  type == "image" && defined(image) => {
    type,
    image{${ImageFragment}},
    "video": null,
    "rive": null,
    "lottie": null,
    "aspectRatio": select(
      defined(aspectRatio) && aspectRatio != 0 => aspectRatio,
      true => image.asset->metadata.dimensions.aspectRatio,
    ),
  },
  type == "videoMux" && defined(video) => {
    type,
    "image": null,
    "rive": null,
    "lottie": null,
    video{${VideoFragment}},
    videoCover{${ImageFragment}},
    animatedThumbnail{enabled, start, end},
    "aspectRatio": select(
      defined(aspectRatio) && aspectRatio != 0 => aspectRatio,
      true => video.asset->data.tracks[0].max_width / video.asset->data.tracks[0].max_height,
    ),
  },
  type == "lottie" && defined(lottieFile.asset) => {
    type,
    "image": null,
    "video": null,
    "rive": null,
    "lottie": {
      "_id": lottieFile.asset->_id,
      "url": lottieFile.asset->url,
      "dimensions": select(
        defined(lottieDimensions.width) && defined(lottieDimensions.height) && lottieDimensions.width > 0 => {
          "width": lottieDimensions.width,
          "height": lottieDimensions.height,
          "aspectRatio": lottieDimensions.width / lottieDimensions.height,
        },
        true => null
      )
    },
    "aspectRatio": select(
      defined(aspectRatio) && aspectRatio != 0 => aspectRatio,
      defined(lottieDimensions.width) && defined(lottieDimensions.height) && lottieDimensions.width > 0 => lottieDimensions.width / lottieDimensions.height,
      true => null
    ),
  },
  type == "rive" && defined(riveFile.asset) => {
    type,
    "image": null,
    "video": null,
    "lottie": null,
    "rive": {
      "_id": riveFile.asset->_id,
      "url": riveFile.asset->url,
      "dimensions": select(
        defined(riveDimensions.width) && defined(riveDimensions.height) && riveDimensions.width > 0 => {
          "width": riveDimensions.width,
          "height": riveDimensions.height,
          "aspectRatio": riveDimensions.width / riveDimensions.height,
        },
        true => null
      )
    },
    "aspectRatio": select(
      defined(aspectRatio) && aspectRatio != 0 => aspectRatio,
      defined(riveDimensions.width) && defined(riveDimensions.height) && riveDimensions.width > 0 => riveDimensions.width / riveDimensions.height,
      true => null
    ),
  },
  type == "videoFile" && defined(videoFile.asset) => {
    type,
    "image": null,
    "video": null,
    "rive": null,
    "lottie": null,
    "videoFile": {
      "_id": videoFile.asset->_id,
      "url": videoFile.asset->url,
      "mimeType": videoFile.asset->mimeType,
      "dimensions": select(
        defined(videoFileDimensions.width) && defined(videoFileDimensions.height) && videoFileDimensions.width > 0 => {
          "width": videoFileDimensions.width,
          "height": videoFileDimensions.height,
          "aspectRatio": videoFileDimensions.width / videoFileDimensions.height,
        },
        true => null
      )
    },
    "aspectRatio": select(
      defined(aspectRatio) && aspectRatio != 0 => aspectRatio,
      defined(videoFileDimensions.width) && defined(videoFileDimensions.height) && videoFileDimensions.width > 0 => videoFileDimensions.width / videoFileDimensions.height,
      true => null
    ),
  },
  type == "videoUrl" && defined(videoUrl) => {
    type,
    "image": null,
    "video": null,
    "rive": null,
    "lottie": null,
    "videoFile": null,
    "videoUrl": {
      "url": videoUrl,
      "dimensions": select(
        defined(videoUrlDimensions.width) && defined(videoUrlDimensions.height) && videoUrlDimensions.width > 0 => {
          "width": videoUrlDimensions.width,
          "height": videoUrlDimensions.height,
          "aspectRatio": videoUrlDimensions.width / videoUrlDimensions.height,
        },
        true => null
      )
    },
    "aspectRatio": select(
      defined(aspectRatio) && aspectRatio != 0 => aspectRatio,
      defined(videoUrlDimensions.width) && defined(videoUrlDimensions.height) && videoUrlDimensions.width > 0 => videoUrlDimensions.width / videoUrlDimensions.height,
      true => null
    ),
  },
  true => {
    "type": null,
    "image": null,
    "video": null,
    "rive": null,
    "lottie": null,
    "videoFile": null,
    "videoUrl": null,
    "aspectRatio": null,
  }
)
`;

type VideoOptions = {
  loop?: boolean;
  muted?: boolean;
  autoPlay?: boolean;
  noControls?: boolean;
};

type LottieOptions = {
  loop?: boolean;
  autoPlay?: boolean;
};

type RiveOptions = {
  loop?: boolean;
  autoPlay?: boolean;
};

export type LottieFragmentResult = {
  _id?: string;
  url?: string | null;
  dimensions?: {
    width?: number;
    height?: number;
    aspectRatio?: number;
  } | null;
};

export type RiveFragmentResult = {
  _id?: string;
  url?: string | null;
  dimensions?: {
    width?: number;
    height?: number;
    aspectRatio?: number;
  } | null;
};

export type VideoFileFragmentResult = {
  _id?: string;
  url?: string | null;
  mimeType?: string | null;
  dimensions?: {
    width?: number;
    height?: number;
    aspectRatio?: number;
  } | null;
};

export type AnimatedThumbnailFragmentResult = {
  enabled?: boolean | null;
  start?: number | null;
  end?: number | null;
};

export type MediaFragmentResult = {
  aspectRatio?: number | null;
  type?: "videoMux" | "image" | "rive" | "lottie" | "videoFile" | "videoUrl" | null;
  image?: ImageFragmentResult | null;
  video?: VideoFragmentResult | null;
  videoFile?: VideoFileFragmentResult | null;
  videoUrl?: VideoFileFragmentResult | null;
  rive?: RiveFragmentResult | null;
  lottie?: LottieFragmentResult | null;
  videoCover?: ImageFragmentResult | null;
  videoOptions?: VideoOptions | null;
  riveOptions?: RiveOptions | null;
  lottieOptions?: LottieOptions | null;
  animatedThumbnail?: AnimatedThumbnailFragmentResult | null;
};
