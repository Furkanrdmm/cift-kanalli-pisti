// Emojiler her telefonda farklı göründüğü için simgeler burada çizilir; rengi yazı renginden alır
const PATHS = {
  back: 'M15 5l-7 7 7 7',
  gear: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7.6 7.6 0 0 1-2 1.2l-.3 2h-3.9l-.3-2a7.6 7.6 0 0 1-2-1.2l-1.9.7-2-3.4 1.6-1.2a7.6 7.6 0 0 1 0-3L2.7 9.3l2-3.4 1.9.7a7.6 7.6 0 0 1 2-1.2l.3-2h3.9l.3 2a7.6 7.6 0 0 1 2 1.2l1.9-.7 2 3.4-1.6 1.2a7.6 7.6 0 0 1 0 3z',
  book: 'M4 5.5C6.5 4 9.5 4 12 5.5v14c-2.5-1.5-5.5-1.5-8 0zM20 5.5C17.5 4 14.5 4 12 5.5v14c2.5-1.5 5.5-1.5 8 0z',
  chart: 'M4 20h16M7 16v-5M12 16V6M17 16v-8',
  cards: 'M8 4h9a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 17 18H8a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 8 4zM4 7.5v11A1.5 1.5 0 0 0 5.5 20H14',
}

export function Icon({ name, size = 20 }: { name: keyof typeof PATHS; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  )
}
