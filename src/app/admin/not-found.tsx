import Link from "next/link";
import { Button, Card, EmptyState } from "@/src/components/ui";

export default function AdminNotFound() {
  return (
    <Card>
      <EmptyState
        title="Page not found"
        description="That admin route does not exist."
        action={
          <Button asChild variant="secondary" size="sm">
            <Link href="/admin">Back to dashboard</Link>
          </Button>
        }
      />
    </Card>
  );
}
