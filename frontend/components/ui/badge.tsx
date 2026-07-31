interface BadgeProps {
  text: string;
  color?: "green" | "red" | "yellow";
}

export default function Badge({
  text,
  color = "green",
}: BadgeProps) {
  const colors = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[color]}`}
    >
      {text}
    </span>
  );
}