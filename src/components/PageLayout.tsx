import type { ReactNode } from 'react'
import Navbar from './Navbar'

const STARS = [
  { x:  7, y:  4, size: 1.5, dur: 3.1, delay: 0.4 },
  { x: 18, y: 12, size: 1,   dur: 2.6, delay: 1.2 },
  { x: 31, y:  7, size: 2,   dur: 3.8, delay: 0.1 },
  { x: 45, y:  3, size: 1,   dur: 2.9, delay: 2.0 },
  { x: 58, y: 15, size: 1.5, dur: 3.4, delay: 0.8 },
  { x: 70, y:  6, size: 1,   dur: 2.3, delay: 1.5 },
  { x: 83, y: 10, size: 2,   dur: 4.1, delay: 0.3 },
  { x: 92, y:  2, size: 1,   dur: 3.0, delay: 2.4 },
  { x: 24, y: 28, size: 1,   dur: 2.7, delay: 0.6 },
  { x: 52, y: 35, size: 1.5, dur: 3.6, delay: 1.7 },
  { x: 76, y: 20, size: 1,   dur: 2.4, delay: 0.9 },
  { x: 12, y: 50, size: 2,   dur: 4.3, delay: 1.3 },
  { x: 65, y: 60, size: 1,   dur: 3.2, delay: 0.5 },
  { x: 88, y: 45, size: 1.5, dur: 2.8, delay: 2.1 },
  { x: 40, y: 75, size: 1,   dur: 3.7, delay: 0.7 },
]

export default function PageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh overflow-x-hidden flex flex-col" style={{ background: '#060a23' }}>

      {/* Fixed star field — stays put as content scrolls */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        {STARS.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left:      `${star.x}%`,
              top:       `${star.y}%`,
              width:     `${star.size}px`,
              height:    `${star.size}px`,
              animation: `twinkle ${star.dur}s ease-in-out ${star.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Moonlight glow */}
      <div
        className="fixed inset-x-0 top-0 h-48 pointer-events-none"
        style={{
          zIndex: 0,
          background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(100,130,220,0.09), transparent)',
        }}
      />

      {/* Fixed campfire scene — sticks to viewport bottom regardless of scroll */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none" style={{ zIndex: 1 }}>
        <div
          style={{
            height: '60px',
            background: 'linear-gradient(to bottom, transparent, #060a23)',
            marginBottom: '-2px',
          }}
        />
        <img
          src="/fire_scene_no_characters.webp"
          alt=""
          className="w-full block"
          style={{
            imageRendering: 'pixelated',
            aspectRatio: '100 / 56',
            maxHeight: '280px',
            objectFit: 'cover',
            objectPosition: 'bottom',
          }}
        />
        <div style={{ background: '#230d09', height: '24px' }} />
      </div>

      {/* Content layer — above campfire */}
      <div className="relative flex flex-col flex-1" style={{ zIndex: 2 }}>
        <Navbar />

        <main className="max-w-lg mx-auto px-4 py-6 flex-1 w-full">
          {children}
        </main>
      </div>

    </div>
  )
}
