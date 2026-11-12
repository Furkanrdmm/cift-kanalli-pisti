// İstatistik ekranındaki tek bir sayı kutusu

export function StatTile({ label, value, sub, gold }: { label: string; value: number | string; sub?: string; gold?: boolean }) {
  return (
    <div className={'stat-tile' + (gold ? ' stat-tile--gold' : '')}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}
