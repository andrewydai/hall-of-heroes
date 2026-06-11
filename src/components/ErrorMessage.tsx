export default function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
      <p className="text-blue-400 text-sm italic">{message}</p>
    </div>
  )
}
