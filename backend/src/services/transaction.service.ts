export const createTransaction = async ({
  userId,
  type,
  category,
  amount,
  status = "SUCCESS",
  description,
  metadata = {},
  session,
}: CreateTransactionParams) => {
  const [transaction] = await Transaction.create(
    [
      {
        user: userId,
        type,
        category,
        amount,
        status,
        reference: uuidv4(),
        description,
        metadata,
      },
    ],
    { session }
  );

  return transaction;
};