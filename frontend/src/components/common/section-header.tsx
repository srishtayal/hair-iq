import { cn } from "@/lib/utils";

export default function SectionHeader({
  eyebrow,
  title,
  description,
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.35em] text-champagne">{eyebrow}</p> : null}
      <h2 className="font-display text-3xl text-coal md:text-4xl">{title}</h2>
      {description ? <p className="max-w-2xl text-sm text-gray-600 md:text-base">{description}</p> : null}
    </div>
  );
}
