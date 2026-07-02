import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

export default function WalletCard() {
  return (
    <Card className="bg-blue-700 text-white border-0">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">

          <div>
            <p className="text-blue-100">
              Wallet Balance
            </p>

            <h2 className="mt-2 text-4xl font-bold">
              ₦25,000.00
            </h2>

            <p className="mt-2 text-sm text-blue-200">
              Last updated just now
            </p>
          </div>

          <Wallet size={60} />
        </div>

        <Button
          className="mt-6"
          variant="secondary"
        >
          Fund Wallet
        </Button>
      </CardContent>
    </Card>
  );
}