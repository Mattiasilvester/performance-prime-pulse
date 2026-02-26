import React from 'react';
import { SchedaAllenamento, Esercizio } from '../services/WorkoutExtractor';
import './SchedaView.css';

interface SchedaViewProps {
  scheda: SchedaAllenamento;
  onEdit?: (esercizio: Esercizio, index: number, section: string) => void;
  onDelete?: (index: number, section: string) => void;
}

const SchedaView: React.FC<SchedaViewProps> = ({ scheda, onEdit, onDelete }) => {
  return (
    <div className="scheda-view">
      <div className="scheda-header">
        <h2>📋 Scheda di Allenamento</h2>
        <div className="scheda-metadata">
          <div className="metadata-item">
            <span className="label">Tipo:</span>
            <span className="value">{scheda.metadata.tipoAllenamento || 'Non specificato'}</span>
          </div>
          <div className="metadata-item">
            <span className="label">Durata:</span>
            <span className="value">{scheda.metadata.durataStimata || 'Non specificata'}</span>
          </div>
          <div className="metadata-item">
            <span className="label">Difficoltà:</span>
            <span className="value">{scheda.metadata.difficolta || 'Non specificata'}</span>
          </div>
        </div>
      </div>

      <div className="scheda-sections">
        {/* RISCALDAMENTO */}
        <Section 
          title="🔥 Riscaldamento" 
          esercizi={scheda.riscaldamento.esercizi}
          generato={scheda.riscaldamento.generato}
          presente={scheda.riscaldamento.presente}
          sectionType="riscaldamento"
          onEdit={onEdit}
          onDelete={onDelete}
        />

        {/* SCHEDA GIORNALIERA */}
        <Section 
          title="💪 Allenamento Principale" 
          esercizi={scheda.schedaGiornaliera.esercizi}
          generato={false}
          presente={true}
          sectionType="allenamento"
          onEdit={onEdit}
          onDelete={onDelete}
        />

        {/* STRETCHING */}
        <Section 
          title="🧘 Stretching" 
          esercizi={scheda.stretching.esercizi}
          generato={scheda.stretching.generato}
          presente={scheda.stretching.presente}
          sectionType="stretching"
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      {/* FOOTER CON INFO */}
      <div className="scheda-footer">
        <div className="info-box">
          <h4>ℹ️ Informazioni</h4>
          <ul>
            <li>Fonte: {scheda.metadata.fonte}</li>
            {scheda.riscaldamento.generato && (
              <li>🔥 Riscaldamento generato automaticamente</li>
            )}
            {scheda.stretching.generato && (
              <li>🧘 Stretching generato automaticamente</li>
            )}
            <li>Totale esercizi: {scheda.schedaGiornaliera.esercizi.length}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// ===== SECTION COMPONENT =====

interface SectionProps {
  title: string;
  esercizi: Esercizio[];
  generato: boolean;
  presente: boolean;
  sectionType: string;
  onEdit?: (esercizio: Esercizio, index: number, section: string) => void;
  onDelete?: (index: number, section: string) => void;
}

const Section: React.FC<SectionProps> = ({ 
  title, 
  esercizi, 
  generato, 
  presente, 
  sectionType,
  onEdit,
  onDelete 
}) => {
  if (!presente && esercizi.length === 0) {
    return null;
  }

  return (
    <div className={`section ${generato ? 'generated' : ''}`}>
      <div className="section-header">
        <h3>{title}</h3>
        {generato && (
          <span className="generated-badge">Auto-generato</span>
        )}
      </div>

      {esercizi.length === 0 ? (
        <div className="empty-section">
          <p>Nessun esercizio trovato in questa sezione</p>
        </div>
      ) : (
        <div className="esercizi-list">
          {esercizi.map((esercizio, index) => (
            <EsercizioCard
              key={index}
              esercizio={esercizio}
              index={index}
              sectionType={sectionType}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ===== ESERCIZIO CARD =====

interface EsercizioCardProps {
  esercizio: Esercizio;
  index: number;
  sectionType: string;
  onEdit?: (esercizio: Esercizio, index: number, section: string) => void;
  onDelete?: (index: number, section: string) => void;
}

const EsercizioCard: React.FC<EsercizioCardProps> = ({ 
  esercizio, 
  index, 
  sectionType,
  onEdit,
  onDelete 
}) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'high';
    if (confidence >= 0.7) return 'medium';
    return 'low';
  };

  return (
    <div className={`esercizio-card confidence-${getConfidenceColor(esercizio.confidence || 0)}`}>
      <div className="esercizio-header">
        <h4 className="esercizio-nome">{esercizio.nome}</h4>
        <div className="esercizio-actions">
          {onEdit && (
            <button 
              onClick={() => onEdit(esercizio, index, sectionType)}
              className="edit-btn"
              title="Modifica esercizio"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button 
              onClick={() => onDelete(index, sectionType)}
              className="delete-btn"
              title="Elimina esercizio"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      <div className="esercizio-details">
        {esercizio.ripetute && esercizio.ripetizioni && (
          <div className="detail-item">
            <span className="label">Serie:</span>
            <span className="value">{esercizio.ripetute}x{esercizio.ripetizioni}</span>
          </div>
        )}

        {esercizio.durata && (
          <div className="detail-item">
            <span className="label">Durata:</span>
            <span className="value">{esercizio.durata}</span>
          </div>
        )}

        {esercizio.riposo && (
          <div className="detail-item">
            <span className="label">Riposo:</span>
            <span className="value">{esercizio.riposo}</span>
          </div>
        )}

        {esercizio.note && (
          <div className="detail-item">
            <span className="label">Note:</span>
            <span className="value">{esercizio.note}</span>
          </div>
        )}

        {esercizio.confidence && (
          <div className="confidence-indicator">
            <span className="label">Confidenza:</span>
            <div className="confidence-bar">
              <div 
                className="confidence-fill" 
                style={{ width: `${esercizio.confidence * 100}%` }}
              />
            </div>
            <span className="confidence-text">
              {Math.round(esercizio.confidence * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedaView;
