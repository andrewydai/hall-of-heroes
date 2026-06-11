interface StatCardProps {
  value: string | number
  label: string
}

export default function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="bg-[#060a23]/80 border border-blue-900/60 rounded-lg p-4 text-center flex-1">
      <div className="font-jacquard text-tavern-gold" style={{ fontSize: '2.6rem', lineHeight: 1 }}>{value}</div>
      <div className="text-xs text-blue-400 mt-2 uppercase tracking-wider">{label}</div>
    </div>
  )
}
