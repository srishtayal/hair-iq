"use client";

import { Video } from "@/types";
import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type VideoCardProps = {
  video: Video;
  onPlay: (video: Video) => void;
  autoPreviewEnabled?: boolean;
  isAutoFocused?: boolean;
  onVisibilityChange?: (videoId: string, ratio: number) => void;
};

export default function VideoCard({
  video,
  onPlay,
  autoPreviewEnabled = false,
  isAutoFocused = false,
  onVisibilityChange
}: VideoCardProps) {
  const [isManualPreviewing, setIsManualPreviewing] = useState(false);
  const cardRef = useRef<HTMLArticleElement | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLongPressAtRef = useRef(0);

  const canPreviewInline = /\.(mp4|webm|ogg)(\?|$)/i.test(video.embedUrl);
  const shouldPreview = isManualPreviewing || (autoPreviewEnabled && isAutoFocused);

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
      const playPromise = media.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
      return;
    }

    media.pause();
    media.currentTime = 0;
  }, [shouldPreview]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  const clearHoldTimer = () => {
    if (!holdTimerRef.current) return;
    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
  };

  const handlePointerEnter = (pointerType: string) => {
    if (!canPreviewInline || pointerType !== "mouse") return;
    setIsManualPreviewing(true);
  };

  const handlePointerLeave = (pointerType: string) => {
    if (!canPreviewInline || pointerType !== "mouse") return;
    clearHoldTimer();
    setIsManualPreviewing(false);
  };

  const handlePointerDown = (pointerType: string) => {
    if (!canPreviewInline || pointerType !== "touch") return;
    clearHoldTimer();
    holdTimerRef.current = setTimeout(() => {
      lastLongPressAtRef.current = Date.now();
      setIsManualPreviewing(true);
    }, 250);
  };

  const handlePointerMove = (pointerType: string) => {
    if (!canPreviewInline || pointerType !== "touch") return;
    if (Date.now() - lastLongPressAtRef.current > 350) {
      clearHoldTimer();
    }
  };

  const handlePointerUpOrCancel = (pointerType: string) => {
    if (!canPreviewInline || pointerType !== "touch") return;
    clearHoldTimer();
    setIsManualPreviewing(false);
  };

  const handleOpenVideo = () => {
    if (Date.now() - lastLongPressAtRef.current < 500) {
      return;
    }
    onPlay(video);
  };

  return (
    <motion.article
      ref={cardRef}
      whileHover={{ y: -4 }}
      className="group overflow-hidden rounded-2xl border border-graphite/10 bg-transparent"
      onPointerEnter={(event) => handlePointerEnter(event.pointerType)}
      onPointerLeave={(event) => handlePointerLeave(event.pointerType)}
      onPointerDown={(event) => handlePointerDown(event.pointerType)}
      onPointerMove={(event) => handlePointerMove(event.pointerType)}
      onPointerUp={(event) => handlePointerUpOrCancel(event.pointerType)}
      onPointerCancel={(event) => handlePointerUpOrCancel(event.pointerType)}
    >
      <div
        className="relative aspect-[3/4] cursor-pointer"
        onClick={handleOpenVideo}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleOpenVideo();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Open ${video.title}`}
      >
        {canPreviewInline ? (
          <video
            ref={previewRef}
            src={video.embedUrl}
            muted
            loop
            playsInline
            preload="metadata"
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
      <div className="space-y-2 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-champagne">{video.category}</p>
        <h3 className="font-semibold text-coal">{video.title}</h3>
        <p className="text-sm text-gray-600">{video.description}</p>
      </div>
    </motion.article>
  );
}
