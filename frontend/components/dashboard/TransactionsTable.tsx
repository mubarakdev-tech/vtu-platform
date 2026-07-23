"use client";

import { useEffect, useState } from "react";

import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { Card, CardContent } from "@/components/ui/card";

interface Transaction {
  _id: string;
  service: string;
  amount: number;
  status: string;
  createdAt?: string;
}

export default function TransactionsTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          "http://localhost:5000/api/transactions",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        setTransactions(data.transactions || []);

      } catch (error) {
        console.log("Transaction error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);


  return (
    <Card>
      <CardContent className="p-6">

        <h2 className="text-xl font-semibold mb-4">
          Recent Transactions
        </h2>


        {loading ? (

          <p>Loading transactions...</p>

        ) : (

          <Table>

            <TableHeader>

              <TableRow>

                <TableHead>
                  Service
                </TableHead>

                <TableHead>
                  Amount
                </TableHead>

                <TableHead>
                  Status
                </TableHead>

                <TableHead>
                  Date
                </TableHead>

              </TableRow>

            </TableHeader>


            <TableBody>

              {transactions.length === 0 ? (

                <TableRow>
                  <TableCell colSpan={4}>
                    No transactions yet
                  </TableCell>
                </TableRow>


              ) : (

                transactions.map((tx) => (

                  <TableRow key={tx._id}>

                    <TableCell>
                      {tx.service}
                    </TableCell>


                    <TableCell>
                      ₦{tx.amount.toLocaleString()}
                    </TableCell>


                    <TableCell>
                      {tx.status}
                    </TableCell>


                    <TableCell>
                      {tx.createdAt
                        ? new Date(tx.createdAt).toLocaleDateString()
                        : "-"}
                    </TableCell>


                  </TableRow>

                ))

              )}

            </TableBody>

          </Table>

        )}

      </CardContent>
    </Card>
  );
}