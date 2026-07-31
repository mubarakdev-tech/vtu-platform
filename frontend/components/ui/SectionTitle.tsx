interface Props {
  title: string;
  subtitle?: string;
}

export default function SectionTitle({
  title,
  subtitle,
}: Props) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl font-bold">{title}</h2>

      {subtitle && (
        <p className="text-gray-500 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}