/**
 * Servizio import clienti da Excel/CSV.
 * Parsing, auto-mapping colonne, validazione, insert batch.
 * Prima riga = header; supporta , e ; per CSV; usa prima sheet.
 */

import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

const MAX_ROWS = 500;
const BATCH_SIZE = 50;

export const COLUMN_MAPPINGS: Record<string, string[]> = {
  full_name: ['nome', 'name', 'nome completo', 'full name', 'nominativo', 'cliente', 'nome e cognome', 'cognome e nome'],
  email: ['email', 'e-mail', 'mail', 'indirizzo email', 'posta elettronica'],
  phone: ['telefono', 'phone', 'tel', 'cellulare', 'cell', 'mobile', 'numero', 'numero telefono'],
  notes: ['note', 'notes', 'annotazioni', 'commenti', 'osservazioni', 'descrizione'],
};

export type ParsedRow = {
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

export type ParseResult = {
  ok: true;
  headers: string[];
  rows: Record<string, unknown>[];
  rawRows: unknown[][];
} | {
  ok: false;
  error: string;
};

/**
 * Legge il file (prima sheet), prima riga = header.
 * CSV: SheetJS gestisce , e ; nativamente.
 */
export function parseFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve({ ok: false, error: 'Impossibile leggere il file' });
          return;
        }
        const wb = XLSX.read(data, { type: 'array', raw: false });
        const firstSheetName = wb.SheetNames[0];
        if (!firstSheetName) {
          resolve({ ok: false, error: 'Il file è vuoto' });
          return;
        }
        const ws = wb.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' }) as unknown[][];
        if (!rawRows || rawRows.length === 0) {
          resolve({ ok: false, error: 'Il file è vuoto' });
          return;
        }
        const headerRow = rawRows[0];
        const headers = (Array.isArray(headerRow) ? headerRow : [headerRow]).map((h) => String(h ?? '').trim());
        if (headers.every((h) => !h)) {
          resolve({ ok: false, error: 'Nessuna intestazione trovata' });
          return;
        }
        const dataRows = rawRows.slice(1);
        if (dataRows.length === 0) {
          resolve({ ok: false, error: 'Nessun cliente trovato nel file' });
          return;
        }
        if (dataRows.length > MAX_ROWS) {
          resolve({ ok: false, error: `Massimo ${MAX_ROWS} clienti per importazione` });
          return;
        }
        const rows = dataRows.map((row) => {
          const arr = Array.isArray(row) ? row : [row];
          const obj: Record<string, unknown> = {};
          headers.forEach((h, i) => {
            obj[h] = arr[i] ?? '';
          });
          return obj;
        });
        resolve({ ok: true, headers, rows, rawRows });
      } catch {
        resolve({ ok: false, error: 'Formato file non supportato' });
      }
    };
    reader.onerror = () => resolve({ ok: false, error: 'Errore nella lettura del file' });
    reader.readAsArrayBuffer(file);
  });
}

export function autoMapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
    const match = headers.find((h) => {
      const normalized = h.toLowerCase().trim();
      return aliases.some((alias) => normalized.includes(alias));
    });
    if (match) mapping[field] = match;
  }
  return mapping;
}

function getCellValue(row: Record<string, unknown>, headerKey: string): string {
  const v = row[headerKey];
  if (v == null) return '';
  return String(v).trim();
}

export type MapRowsResult = {
  rows: ParsedRow[];
  skippedNoName: number;
  skippedDuplicateInFile: number;
};

/**
 * Mappa le righe con il mapping colonne scelto.
 * Duplicate nel file: tiene solo la prima occorrenza per email.
 */
export function mapRows(
  rows: Record<string, unknown>[],
  columnMapping: Record<string, string>
): MapRowsResult {
  const seenEmails = new Set<string>();
  const result: ParsedRow[] = [];
  let skippedNoName = 0;
  let skippedDuplicateInFile = 0;
  for (const row of rows) {
    const full_name = columnMapping.full_name ? getCellValue(row, columnMapping.full_name) : '';
    const emailRaw = columnMapping.email ? getCellValue(row, columnMapping.email) : '';
    const email = emailRaw || null;
    const phone = columnMapping.phone ? getCellValue(row, columnMapping.phone) : '';
    const notes = columnMapping.notes ? getCellValue(row, columnMapping.notes) : '';
    if (!full_name.trim()) {
      skippedNoName++;
      continue;
    }
    const emailKey = email ? email.toLowerCase().trim() : '';
    if (emailKey && seenEmails.has(emailKey)) {
      skippedDuplicateInFile++;
      continue;
    }
    if (emailKey) seenEmails.add(emailKey);
    result.push({
      full_name: full_name.trim(),
      email: email || null,
      phone: phone || null,
      notes: notes || null,
    });
  }
  return { rows: result, skippedNoName, skippedDuplicateInFile };
}

export type ClientExportRow = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

/**
 * Recupera i clienti del professionista per export Excel (stesso client Supabase, RLS).
 */
export async function getClientsForExport(
  professionalId: string
): Promise<ClientExportRow[]> {
  const { data } = await supabase
    .from('clients')
    .select('full_name, email, phone, notes')
    .eq('professional_id', professionalId)
    .order('full_name', { ascending: true });
  return (data ?? []) as ClientExportRow[];
}

/**
 * Genera e scarica Excel con i clienti esistenti.
 * Colonne: Nome Completo, Email, Telefono, Note.
 * Nome file: PrimePro_Clienti_YYYY-MM-DD.xlsx
 */
export function downloadClientsExcel(clients: ClientExportRow[]): void {
  const rows = clients.map((c) => ({
    'Nome Completo': c.full_name ?? '',
    Email: c.email ?? '',
    Telefono: c.phone ?? '',
    Note: c.notes ?? '',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 25 },
    { wch: 30 },
    { wch: 20 },
    { wch: 40 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clienti');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `PrimePro_Clienti_${dateStr}.xlsx`);
}

export function downloadTemplate(): void {
  const templateData = [
    {
      'Nome Completo': 'Mario Rossi',
      Email: 'mario@email.com',
      Telefono: '+39 333 1234567',
      Note: 'Cliente dal 2023',
    },
    {
      'Nome Completo': 'Laura Bianchi',
      Email: 'laura@email.com',
      Telefono: '+39 345 9876543',
      Note: 'Obiettivo: perdita peso',
    },
  ];
  const ws = XLSX.utils.json_to_sheet(templateData);
  ws['!cols'] = [
    { wch: 25 },
    { wch: 30 },
    { wch: 20 },
    { wch: 40 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clienti');
  XLSX.writeFile(wb, 'PrimePro_Template_Clienti.xlsx');
}

/**
 * Recupera le email già presenti per il professionista (stesso client Supabase, RLS).
 */
export async function getExistingEmails(professionalId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('clients')
    .select('email')
    .eq('professional_id', professionalId)
    .not('email', 'is', null);
  const set = new Set<string>();
  for (const row of data || []) {
    const e = (row as { email?: string | null }).email;
    if (e && typeof e === 'string') set.add(e.toLowerCase().trim());
  }
  return set;
}

export type ValidationResult = {
  validRows: ParsedRow[];
  skippedNoName: number;
  skippedDuplicateEmail: number;
  totalRows: number;
};

/**
 * Filtra righe con email già presenti in DB. skippedNoName e skippedDuplicateInFile
 * vengono da mapRows; qui aggiungiamo solo skippedDuplicateInDb.
 */
export async function validateAndPrepareRows(
  mapResult: MapRowsResult,
  professionalId: string
): Promise<ValidationResult> {
  const { rows, skippedNoName, skippedDuplicateInFile } = mapResult;
  const existingEmails = await getExistingEmails(professionalId);
  let skippedDuplicateInDb = 0;
  const validRows: ParsedRow[] = [];
  for (const row of rows) {
    const emailKey = row.email ? row.email.toLowerCase().trim() : '';
    if (emailKey && existingEmails.has(emailKey)) {
      skippedDuplicateInDb++;
      continue;
    }
    validRows.push(row);
  }
  return {
    validRows,
    skippedNoName,
    skippedDuplicateEmail: skippedDuplicateInFile + skippedDuplicateInDb,
    totalRows: rows.length + skippedNoName + skippedDuplicateInFile,
  };
}

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: number;
  errorMessage?: string;
};

/**
 * Inserimento in batch da 50. Stop al primo errore; restituisce quanti importati fino a quel punto.
 */
export async function importClients(
  rows: ParsedRow[],
  professionalId: string,
  onProgress?: (percent: number) => void
): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errors: 0 };
  const total = rows.length;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE).map((row) => ({
      professional_id: professionalId,
      full_name: row.full_name,
      email: row.email || null,
      phone: row.phone || null,
      notes: row.notes || null,
      is_pp_subscriber: false,
    }));
    const { error, data } = await supabase.from('clients').insert(batch).select();
    if (error) {
      result.errors += batch.length;
      result.errorMessage = error.message;
      if (onProgress) onProgress(Math.round((i / total) * 100));
      return result;
    }
    result.imported += (data?.length ?? 0);
    if (onProgress) onProgress(Math.round(((i + batch.length) / total) * 100));
  }
  return result;
}
