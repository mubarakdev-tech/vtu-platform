import { Card, CardContent } from "@/components/ui/card";
import {
  Smartphone,
  Wifi,
  Zap,
  Tv,
} from "lucide-react";

const actions = [
  {
    title: "Airtime",
    icon: Smartphone,
  },
  {
    title: "Data",
    icon: Wifi,
  },
  {
    title: "Electricity",
    icon: Zap,
  },
  {
    title: "Cable TV",
    icon: Tv,
  },
];

export default function QuickActions() {
  return (
    <Card>
      <CardContent className="p-6">

        <h2 className="mb-6 text-xl font-semibold">
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.title}
                className="rounded-lg border p-6 transition hover:bg-blue-700 hover:text-white"
              >
                <Icon className="mx-auto mb-3" size={32} />

                <p>{action.title}</p>
              </button>
            );
          })}

        </div>

      </CardContent>
    </Card>
  );
}