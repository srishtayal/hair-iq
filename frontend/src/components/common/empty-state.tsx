import Link from "next/link";

export default function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref
}: {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center shadow-soft">
      <h3 className="font-display text-3xl text-coal">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm text-gray-600">{description}</p>
      <Link
        href={ctaHref}
        className="mt-6 inline-flex rounded-full bg-champagne px-6 py-3 text-sm font-semibold text-coal transition hover:bg-[#e5c9a6]"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
