// Telefonun gri onay penceresi yerine oyunun görünümünde soru penceresi
export function ConfirmDialog({ text, yes, onYes, onNo }: { text: string; yes: string; onYes: () => void; onNo: () => void }) {
  return (
    <div className="modal-backdrop modal-backdrop--page" onClick={onNo}>
      <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{text}</h2>
        <div className="modal-actions">
          <button className="btn" onClick={onNo}>
            Vazgeç
          </button>
          <button className="btn btn--primary" onClick={onYes}>
            {yes}
          </button>
        </div>
      </div>
    </div>
  )
}
