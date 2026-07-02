import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { Card, CardContent } from "@/components/ui/card";

const transactions = [
  {
    service: "MTN Airtime",
    amount: "₦1,000",
    status: "Success",
  },
  {
    service: "Glo Data",
    amount: "₦2,500",
    status: "Success",
  },
  {
    service: "IKEDC",
    amount: "₦5,000",
    status: "Pending",
  },
  {
    service: "GOtv",
    amount: "₦6,200",
    status: "Success",
  },
];

export default function TransactionsTable() {
  return (
    <Card>
      <CardContent className="p-6">

        <h2 className="mb-6 text-xl font-semibold">
          Recent Transactions
        </h2>

        <Table>

          <TableHeader>

            <TableRow>

              <TableHead>Service</TableHead>

              <TableHead>Amount</TableHead>

              <TableHead>Status</TableHead>

            </TableRow>

          </TableHeader>

          <TableBody>

            {transactions.map((transaction, index) => (

              <TableRow key={index}>

                <TableCell>
                  {transaction.service}
                </TableCell>

                <TableCell>
                  {transaction.amount}
                </TableCell>

                <TableCell>
                  {transaction.status}
                </TableCell>

              </TableRow>

            ))}

          </TableBody>

        </Table>

      </CardContent>
    </Card>
  );
}