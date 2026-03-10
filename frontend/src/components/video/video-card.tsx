"use client";

import { Video } from "@/types";
import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type VideoCardProps = {
  video: Video;
  autoPreviewEnabled?: boolean;
  isAutoFocused?: boolean;
  onVisibilityChange?: (videoId: string, ratio: number) => void;
  uniformHeight?: boolean;
  hoverPreviewEnabled?: boolean;
  onClick?: () => void;
};

export default function VideoCard({
  video,
  autoPreviewEnabled = false,
  isAutoFocused = false,
  onVisibilityChange,
  uniformHeight = false,
  hoverPreviewEnabled = true,
  onClick
}: VideoCardProps) {
  const [isPointerHovering, setIsPointerHovering] = useState(false);
  const cardRef = useRef<HTMLElement | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);

  const canPreviewInline = /\.(mp4|webm|ogg)(\?|$)/i.test(video.embedUrl);
  const shouldPreview = (hoverPreviewEnabled && isPointerHovering) || (autoPreviewEnabled && isAutoFocused);

  const playPreview = (preferAudio: boolean) => {
    const media = previewRef.current;
    if (!media) return;

    media.muted = !preferAudio;
    const playPromise = media.play();

    if (!playPromise || typeof playPromise.catch !== "function") return;

    playPromise.catch(() => {
      if (!preferAudio) return;
      media.muted = true;
      const fallbackPromise = media.play();
      if (fallbackPromise && typeof fallbackPromise.catch === "function") {
        fallbackPromise.catch(() => {});
      }
    });
  };

  useEffect(() => {
    if (!onVisibilityChange) return;

    if (!canPreviewInline || !autoPreviewEnabled) {
      onVisibilityChange(video.id, 0);
      return;
    }

    const node = cardRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        onVisibilityChange(video.id, entry.isIntersecting ? entry.intersectionRatio : 0);
      },
      {
        threshold: [0, 0.25, 0.5, 0.65, 0.8, 1]
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      onVisibilityChange(video.id, 0);
    };
  }, [autoPreviewEnabled, canPreviewInline, onVisibilityChange, video.id]);

  useEffect(() => {
    const media = previewRef.current;
    if (!media) return;

    if (shouldPreview) {
      playPreview(true);
      return;
    }

    media.pause();
    media.currentTime = 0;
    media.muted = true;
  }, [shouldPreview]);

  const handlePointerEnter = (pointerType: string) => {
    if (!hoverPreviewEnabled || !canPreviewInline || pointerType !== "mouse") return;
    setIsPointerHovering(true);
    playPreview(true);
  };

  const handlePointerLeave = (pointerType: string) => {
    if (!hoverPreviewEnabled || !canPreviewInline || pointerType !== "mouse") return;
    setIsPointerHovering(false);
  };

  return (
    <motion.article
      ref={cardRef}
      whileHover={{ y: -4 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-graphite/10 bg-transparent"
      onPointerEnter={(event) => handlePointerEnter(event.pointerType)}
      onPointerLeave={(event) => handlePointerLeave(event.pointerType)}
      onClick={onClick}
    >
      <div className="relative aspect-[3/4]">
        {canPreviewInline ? (
          <video
            ref={previewRef}
            src={video.embedUrl}
            muted
            loop
            playsInline
            preload="none"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-transparent" />
        <span className="absolute bottom-3 right-3 rounded bg-transparent px-2 py-1 text-xs text-white">{video.duration}</span>
      </div>
      <div className={uniformHeight ? "flex min-h-[150px] flex-col space-y-2 p-4" : "space-y-2 p-4"}>
        <p className="text-xs uppercase tracking-[0.2em] text-champagne">{video.category}</p>
        <h3 className={uniformHeight ? "min-h-[48px] font-semibold text-coal" : "font-semibold text-coal"}>{video.title}</h3>
        <p className={uniformHeight ? "min-h-[60px] text-sm text-gray-600" : "text-sm text-gray-600"}>{video.description}</p>
      </div>
    </motion.article>
  );
}
