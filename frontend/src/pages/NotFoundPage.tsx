import { Link } from "react-router-dom";
import { PageHeader, PageShell } from "@/components/Page";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <PageShell
      header={
        <PageHeader
          title="Page not found"
          subtitle="The page you're looking for doesn't exist or has been moved."
        />
      }
    >
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <p className="text-muted-foreground">Check the address or go back to the home page.</p>
        <Button asChild>
          <Link to="/">Go to Recent matches</Link>
        </Button>
      </div>
    </PageShell>
  );
}
