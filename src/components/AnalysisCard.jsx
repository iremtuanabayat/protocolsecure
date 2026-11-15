import { useState } from 'react';
import { Shield } from 'lucide-react';

function AnalysisCard({ 
  icon: Icon, 
  title, 
  description, 
  placeholder, 
  buttonText = 'Analiz Et', 
  buttonIcon: ButtonIcon = Shield,
  showInput = true,
  onAnalyze 
}) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (showInput && !inputValue.trim()) return;
    onAnalyze(inputValue);
  };

  return (
    <div className="analysis-card">
      <div className="card-header">
        <div className="card-icon-box">
          <Icon size={22} />
        </div>
        <div>
          <h3 className="card-title">{title}</h3>
          <p className="card-desc">{description}</p>
        </div>
      </div>

      <form className="card-body" onSubmit={handleSubmit}>
        {showInput && (
          <input
            type="text"
            className="card-input"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        )}

        <button type="submit" className="card-button">
          <ButtonIcon size={18} />
          <span>{buttonText}</span>
        </button>
      </form>
    </div>
  );
}

export default AnalysisCard;