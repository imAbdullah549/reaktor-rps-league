export function LoadingSpinner() {
  return (
    <div
      className="flex items-center justify-center py-12 text-muted-foreground"
      role="status"
      aria-label="Loading"
    >
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
    </div>
  );
}
