import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "easySLR/components/ui/card";

export function ImportSummary({
  imported,
  skippedDuplicates,
  errors,
}: {
  imported: number;
  skippedDuplicates: number;
  errors: number;
}) {
  return (
    <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
      <CardHeader>
        <CardTitle className="text-base text-green-800 dark:text-green-200">
          Import complete
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-green-700 dark:text-green-300">
        <p>{imported} imported</p>
        {skippedDuplicates > 0 && (
          <p>{skippedDuplicates} skipped (duplicates)</p>
        )}
        {errors > 0 && <p>{errors} errors</p>}
      </CardContent>
    </Card>
  );
}
