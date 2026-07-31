import { Inbox } from "lucide-react";

interface Props {
  title: string;
  description: string;
}

export default function EmptyState({
  title,
  description,
}: Props) {
  return (
    <div className="rounded-2xl border border-dashed p-10 text-center">
      <Inbox
        className="mx-auto text-gray-400"
        size={60}
      />

      <h3 className="mt-4 text-xl font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-gray-500">
        {description}
      </p>
    </div>
  );
}