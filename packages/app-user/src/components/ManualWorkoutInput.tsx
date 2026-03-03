import React, { useState } from 'react';

interface ManualWorkoutInputProps {
  onSave: (testo: string) => void;
}

const ManualWorkoutInput: React.FC<ManualWorkoutInputProps> = ({ onSave }) => {
  const [textInput, setTextInput] = useState('');
  const [showManual, setShowManual] = useState(false);
  
  const handleSave = () => {
    if (!textInput.trim()) {
      alert('Inserisci del testo prima di salvare.');
      return;
    }
    
    onSave(textInput);
    setShowManual(false);
    setTextInput('');
  };
  
  return (
    <div className="manual-input-container">
      {!showManual ? (
        <button 
          onClick={() => setShowManual(true)}
          className="manual-button"
        >
          ✏️ Inserisci manualmente
        </button>
      ) : (
        <div className="manual-form">
          <h3>📝 Incolla o scrivi la tua scheda</h3>
          
          <div className="format-example">
            <strong>Formato esempio:</strong>
            <pre>{`Giorno 1
Squat 4x10
Panca piana 3x8
Rematore 4x10

Giorno 2
Stacco 4x6
Military press 3x10`}</pre>
          </div>
          
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Incolla qui la tua scheda..."
            rows={15}
            className="text-input"
          />
          
          <div className="button-group">
            <button onClick={handleSave} className="save-button">
              💾 Salva Scheda
            </button>
            <button onClick={() => setShowManual(false)} className="cancel-button">
              ❌ Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualWorkoutInput;
