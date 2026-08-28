interface Props {
  title: string;
  value: string | number;
}

export default function DashboardCard({ title, value }: Props) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-gray-500 text-sm">{title}</h3>

      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
