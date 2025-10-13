export interface Esercizio {
  id: string;
  nome: string;
  serie: number;
  ripetizioni: number;
  peso?: number;
  note?: string;
  durata?: number;
  riposo?: number;
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
}



