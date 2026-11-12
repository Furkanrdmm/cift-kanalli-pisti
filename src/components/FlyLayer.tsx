// Uçan kartların çizildiği katman; hesaplar effects/flyers.ts içinde
import type { CSSProperties } from 'react'
import type { Flyer } from '../effects/flyers'
import { PlayingCard } from './PlayingCard'

export function FlyLayer({ flyers }: { flyers: Flyer[] }) {
  return (
    <div className="fly-layer" aria-hidden>
      {flyers.map((f) => (
        <div
          key={f.key}
          className={'flyer flyer--' + f.dir}
          style={
            {
              left: f.box.x,
              top: f.box.y,
              width: f.box.w,
              height: f.box.h,
              '--dx': `${f.dx}px`,
              '--dy': `${f.dy}px`,
              '--s': f.scale,
              '--r0': `${f.r0}deg`,
              '--r1': `${f.r1}deg`,
              animationDuration: `${f.ms}ms`,
              animationDelay: `${f.delay}ms`,
            } as CSSProperties
          }
        >
          <PlayingCard card={f.card} faceDown={f.faceDown} />
        </div>
      ))}
    </div>
  )
}
