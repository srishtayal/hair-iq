import EmptyState from "@/components/common/empty-state";

export default function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you requested does not exist or may have been moved."
      ctaLabel="Return Home"
      ctaHref="/"
    />
  );
}
