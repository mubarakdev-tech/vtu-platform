import { Card, CardContent } from "@/components/ui/card";

const services = [
  "Airtime",
  "Data",
  "Electricity",
  "Cable TV",
  "Exam PIN",
  "Wallet",
];

export default function ServicesGrid() {
  return (
    <Card>
      <CardContent className="p-6">

        <h2 className="mb-6 text-xl font-semibold">
          Available Services
        </h2>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">

          {services.map((service) => (

            <div
              key={service}
              className="rounded-lg border p-6 text-center font-medium transition hover:bg-blue-700 hover:text-white"
            >
              {service}
            </div>

          ))}

        </div>

      </CardContent>
    </Card>
  );
}