import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
}

export default function StatCard({
  title,
  value,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-gray-500">
          {title}
        </p>

        <h3 className="mt-3 text-3xl font-bold">
          {value}
        </h3>
      </CardContent>
    </Card>
  );
}