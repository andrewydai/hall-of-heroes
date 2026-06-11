export default function LoadingSpinner({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-7 h-7 border-2 border-blue-900 border-t-tavern-gold rounded-full animate-spin" />
      <span className="text-blue-400 text-sm italic">{message}</span>
    </div>
  )
}
