import { useState } from 'react'

interface BadgePipProps {
  label: string
  tooltip: string
}

export default function BadgePip({ label, tooltip }: BadgePipProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs border border-blue-800 text-blue-400 rounded px-2 py-0.5 hover:border-blue-500 hover:text-blue-300 transition-colors"
      >
        {label}
      </button>

      {open && (
        <>
          {/* Invisible backdrop closes tooltip on outside tap */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-1.5 z-20 w-52 bg-[#060a23] border border-blue-700 rounded px-3 py-2 text-xs text-blue-200 leading-relaxed shadow-xl">
            {tooltip}
          </div>
        </>
      )}
    </div>
  )
}
