import { History, Trash2 } from 'lucide-react';

function ScanHistory({ history, onSelectHistory, onClearHistory }) {
  if (!history || history.length === 0) return null;

  const badgeColors = {
    safe: { color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', label: 'Güvenli' },
    warning: { color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)', label: 'Şüpheli' },
    danger: { color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', label: 'Yüksek Risk' }
  };

  return (
    <section className="history-section">
      <div className="history-header">
        <div className="history-title">
          <History size={20} color="#00a3cc" />
          <span>Son Yapılan Güvenlik Taramaları ({history.length})</span>
        </div>

        <button className="clear-history-btn" onClick={onClearHistory}>
          <Trash2 size={15} />
          <span>Geçmişi Temizle</span>
        </button>
      </div>

      <div className="history-list">
        {history.map((item) => {
          const badge = badgeColors[item.result.status] || badgeColors.warning;
          return (
            <div
              key={item.id}
              className="history-item"
              onClick={() => onSelectHistory(item.result)}
              title="Detaylı raporu tekrar açmak için tıklayın"
            >
              <div className="history-item-left">
                <div className="history-item-meta">
                  <span className="history-type-badge">{item.type}</span>
                  <span>{item.date}</span>
                </div>
                <div className="history-query">{item.query}</div>
              </div>

              <span
                className="history-status-badge"
                style={{ backgroundColor: badge.bg, color: badge.color }}
              >
                {badge.label} (%{item.result.score})
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ScanHistory;