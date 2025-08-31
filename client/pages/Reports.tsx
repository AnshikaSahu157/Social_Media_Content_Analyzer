import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Reports() {
  return (
    <div className="container py-12">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-2">Save, compare, and export analyses. This is a placeholder — ask to generate specific report views when ready.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Recent Analyses</CardTitle>
            <CardDescription>Your latest content checks at a glance.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>No saved analyses yet.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Export</CardTitle>
            <CardDescription>CSV, PDF, or shareable links.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
