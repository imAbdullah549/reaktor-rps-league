interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 py-12 text-center text-muted-foreground">
      <p>{message}</p>
    </div>
  );
}
