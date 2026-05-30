interface Props {
  label: string
  value: string
}

export default function StatCard({ label, value }: Props) {
  return (
    <div className="flex-1 bg-gray-900 rounded-xl p-4 flex flex-col items-center gap-1">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400 text-center">{label}</p>
    </div>
  )
}
