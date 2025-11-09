export interface Esercizio {
  id: string;
  nome: string;
  serie: number;
  ripetizioni: number;
  peso?: number;
  note?: string;
  durata?: number;
  riposo?: number;
  confidence?: number;
  ripetute?: number; // Alias per ripetizioni per compatibilità
}

export interface SchedaSezione {
  esercizi: Esercizio[];
  generato: boolean;
  presente: boolean;
}

export interface SchedaMetadata {
  tipoAllenamento?: string;
  durataStimata?: string;
  difficolta?: string;
  fonte?: string;
}

export interface SchedaAllenamento {
  id: string;
  nome: string;
  descrizione?: string;
  esercizi: Esercizio[];
  dataCreazione: Date;
  dataModifica?: Date;
  categoria?: string;
  difficolta?: 'Principiante' | 'Intermedio' | 'Avanzato';
  durata?: number;
  // Proprietà estese per SchedaView
  metadata?: SchedaMetadata;
  riscaldamento?: SchedaSezione;
  schedaGiornaliera?: SchedaSezione;
  stretching?: SchedaSezione;
}



