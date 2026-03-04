"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export default function VideoModal({
  open,
  onClose,
  embedUrl,
  title
}: {
  open: boolean;
  onClose: () => void;
  embedUrl: string;
  title: string;
}) {
  const isExternalEmbed = /^https?:\/\/(?:www\.)?(youtube\.com|youtu\.be|player\.vimeo\.com)/i.test(embedUrl);
  const autoplayUrl = embedUrl.includes("?") ? `${embedUrl}&autoplay=1` : `${embedUrl}?autoplay=1`;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
        >
          <motion.div
            initial={{ y: 20, scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 20, scale: 0.95 }}
            className="relative w-full max-w-4xl rounded-2xl border border-black/10 bg-white p-4"
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 rounded-full border border-black/20 bg-white p-2 text-coal"
              aria-label="Close video"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="mb-3 text-sm font-semibold text-coal">{title}</p>
            <div className="aspect-video overflow-hidden rounded-xl">
              {isExternalEmbed ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={open ? autoplayUrl : undefined}
                  title={title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video className="h-full w-full bg-black" src={embedUrl} controls autoPlay playsInline />
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
