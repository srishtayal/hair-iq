"use client";

import { Video } from "@/types";
import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function VideoCard({ video, onPlay }: { video: Video; onPlay: (video: Video) => void }) {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedFromLongPressRef = useRef(false);

  const canPreviewInline = /\.(mp4|webm|ogg)(\?|$)/i.test(video.embedUrl);

  useEffect(() => {
    const media = previewRef.current;
    if (!media) return;

    if (isPreviewing) {
      const playPromise = media.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
      return;
    }

    media.pause();
    media.currentTime = 0;
  }, [isPreviewing]);

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
    setIsPreviewing(true);
  };

  const handlePointerLeave = (pointerType: string) => {
    if (!canPreviewInline || pointerType !== "mouse") return;
    clearHoldTimer();
    setIsPreviewing(false);
  };

  const handlePointerDown = (pointerType: string) => {
    if (!canPreviewInline || pointerType !== "touch") return;
    clearHoldTimer();
    holdTimerRef.current = setTimeout(() => {
      startedFromLongPressRef.current = true;
      setIsPreviewing(true);
    }, 250);
  };

  const handlePointerUpOrCancel = (pointerType: string) => {
    if (!canPreviewInline || pointerType !== "touch") return;
    clearHoldTimer();
    setIsPreviewing(false);
  };

  const handleOpenVideo = () => {
    if (startedFromLongPressRef.current) {
      startedFromLongPressRef.current = false;
      return;
    }
    onPlay(video);
  };

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="group overflow-hidden rounded-2xl border border-graphite/10 bg-transparent"
      onPointerEnter={(event) => handlePointerEnter(event.pointerType)}
      onPointerLeave={(event) => handlePointerLeave(event.pointerType)}
      onPointerDown={(event) => handlePointerDown(event.pointerType)}
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
        <Image
          src={video.thumbnail}
          alt={video.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover transition duration-500 group-hover:scale-105 ${isPreviewing ? "opacity-0" : "opacity-100"}`}
        />
        {canPreviewInline ? (
          <video
            ref={previewRef}
            src={video.embedUrl}
            muted
            loop
            playsInline
            preload="metadata"
            className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${isPreviewing ? "opacity-100" : "opacity-0"}`}
          />
        ) : null}
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
