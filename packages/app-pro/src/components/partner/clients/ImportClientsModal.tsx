/**
 * Modal import clienti da Excel/CSV.
 * 3 fasi: Upload → Anteprima/Mapping → Completato.
 * Escape per chiudere; bottone Importa disabilitato se Nome non mappato; progress bar se > 50 righe.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { X, Upload, FileSpreadsheet, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  parseFile,
  downloadTemplate,
  downloadClientsExcel,
  getClientsForExport,
  autoMapColumns,
  mapRows,
  validateAndPrepareRows,
  importClients,
  type ParseResult,
  type ParsedRow,
  type ValidationResult,
  type ImportResult,
  type ClientExportRow,
} from '@/services/clientImportService';

const FIELD_LABELS: Record<string, string> = {
  full_name: 'Nome Completo',
  email: 'Email',
  phone: 'Telefono',
  notes: 'Note',
};

interface ImportClientsModalProps {
  professionalId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportClientsModal({ professionalId, onClose, onSuccess }: ImportClientsModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [exportClients, setExportClients] = useState<ClientExportRow[] | null>(null);

  const handleClose = useCallback(() => {
    if (!isImporting) onClose();
  }, [isImporting, onClose]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleClose]);

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  // Carica clienti per export/template quando si è in step 1
  useEffect(() => {
    if (step !== 1) return;
    let cancelled = false;
    (async () => {
      const clients = await getClientsForExport(professionalId);
      if (!cancelled) setExportClients(clients);
    })();
    return () => {
      cancelled = true;
    };
  }, [step, professionalId]);

  const handleFile = useCallback(async (f: File) => {
    const res = await parseFile(f);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setFile(f);
    setParseResult(res);
    const mapping = autoMapColumns(res.headers);
    setColumnMapping(mapping);
    setStep(2);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f && /\.(xlsx|xls|csv)$/i.test(f.name)) handleFile(f);
      else toast.error('Formato non supportato. Usa .xlsx, .xls o .csv');
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
      e.target.value = '';
    },
    [handleFile]
  );

  // Validation in step 2 when mapping has full_name
  useEffect(() => {
    if (step !== 2 || !parseResult?.ok || !columnMapping.full_name) {
      setValidationResult(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const mapResult = mapRows(parseResult.rows, columnMapping);
      const validation = await validateAndPrepareRows(mapResult, professionalId);
      if (!cancelled) setValidationResult(validation);
    })();
    return () => {
      cancelled = true;
    };
  }, [step, parseResult, columnMapping, professionalId]);

  const previewRows: ParsedRow[] = validationResult ? validationResult.validRows.slice(0, 5) : [];
  const canImport = Boolean(validationResult && columnMapping.full_name && validationResult.validRows.length > 0);
  const importCount = validationResult?.validRows.length ?? 0;

  const handleImport = useCallback(async () => {
    if (!validationResult || validationResult.validRows.length === 0) return;
    setIsImporting(true);
    setProgress(0);
    const result = await importClients(
      validationResult.validRows,
      professionalId,
      (p) => setProgress(p)
    );
    setImportResult(result);
    setIsImporting(false);
    setStep(3);
    if (result.imported > 0) onSuccess();
  }, [validationResult, professionalId, onSuccess]);

  const handleDownloadTemplate = useCallback(() => {
    if (exportClients && exportClients.length > 0) {
      downloadClientsExcel(exportClients);
      toast.success('Clienti esportati');
    } else {
      downloadTemplate();
      toast.success('Template scaricato');
    }
  }, [exportClients]);

  const totalRows = parseResult?.ok ? parseResult.rows.length : 0;
  const skippedNoName = validationResult?.skippedNoName ?? 0;
  const skippedDup = validationResult?.skippedDuplicateEmail ?? 0;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 id="import-modal-title" className="text-xl font-semibold text-gray-900 dark:text-white">
            Importa Clienti
            {step === 2 && (
              <span className="ml-2 text-sm font-normal text-gray-500">Step 2 di 3</span>
            )}
            {step === 3 && (
              <span className="ml-2 text-sm font-normal text-gray-500">Step 3 di 3</span>
            )}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isImporting}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 disabled:opacity-50"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* FASE 1: Upload */}
          {step === 1 && (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById('import-file-input')?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && (document.getElementById('import-file-input') as HTMLInputElement)?.click()}
                aria-label="Trascina il file qui o clicca per selezionare"
              >
                <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  Trascina qui il tuo file
                </p>
                <p className="text-sm text-gray-500 mt-1">oppure clicca per selezionare</p>
                <p className="text-xs text-gray-400 mt-2">Formati: .xlsx, .xls, .csv</p>
                <input
                  id="import-file-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleInputChange}
                />
              </div>
              <p className="text-center text-sm text-gray-500">— oppure —</p>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Upload className="w-5 h-5" />
                {exportClients === null
                  ? 'Scarica template Excel'
                  : exportClients.length > 0
                    ? 'Esporta clienti (Excel)'
                    : 'Scarica template Excel'}
              </button>
              <p className="text-xs text-gray-500 text-center">
                {exportClients === null
                  ? 'Scarica il template con le colonne da compilare'
                  : exportClients.length > 0
                    ? `Scarica tutti i tuoi ${exportClients.length} clienti in formato Excel`
                    : 'Scarica il template con le colonne da compilare'}
              </p>
            </>
          )}

          {/* FASE 2: Anteprima e mapping */}
          {step === 2 && parseResult?.ok && (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                📊 {totalRows} righe trovate nel file
              </p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Associa le colonne del tuo file:
              </p>
              <div className="space-y-3">
                {Object.entries(FIELD_LABELS).map(([field, label]) => (
                  <div key={field} className="flex flex-wrap items-center gap-2">
                    <label className="w-32 text-sm text-gray-600 dark:text-gray-400">
                      {label}
                      {field === 'full_name' && ' *'}
                    </label>
                    <select
                      value={columnMapping[field] ?? ''}
                      onChange={(e) =>
                        setColumnMapping((prev) => ({ ...prev, [field]: e.target.value }))
                      }
                      className="flex-1 min-w-[140px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#EEBA2B]"
                    >
                      <option value="">— Nessuna —</option>
                      {parseResult.headers.map((h) => (
                        <option key={h} value={h}>
                          {h || '(vuoto)'}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">* Campo obbligatorio</p>

              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <p className="px-3 py-2 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Anteprima prime 5 righe
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left p-2 text-gray-600 dark:text-gray-400">Nome</th>
                        <th className="text-left p-2 text-gray-600 dark:text-gray-400">Email</th>
                        <th className="text-left p-2 text-gray-600 dark:text-gray-400">Telefono</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, i) => (
                        <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                          <td className="p-2 truncate max-w-[120px]" title={row.full_name}>
                            {row.full_name}
                          </td>
                          <td className="p-2 truncate max-w-[140px]" title={row.email ?? ''}>
                            {row.email ?? '—'}
                          </td>
                          <td className="p-2 truncate max-w-[100px]" title={row.phone ?? ''}>
                            {row.phone ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {skippedNoName > 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ {skippedNoName} righe senza nome (verranno saltate)
                </p>
              )}
              {skippedDup > 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ {skippedDup} email duplicate (verranno saltate)
                </p>
              )}

              {validationResult && validationResult.validRows.length === 0 && totalRows > 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Tutti i clienti sono già presenti (email duplicate)
                </p>
              )}

              {isImporting && (
                <div className="w-full">
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>Importazione in corso...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-[#EEBA2B] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setFile(null);
                    setParseResult(null);
                    setColumnMapping({});
                    setValidationResult(null);
                  }}
                  disabled={isImporting}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  ← Indietro
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={!canImport || isImporting}
                  className="px-4 py-2 bg-[#EEBA2B] text-black rounded-lg font-medium hover:bg-[#d4a826] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Importazione...
                    </>
                  ) : (
                    `Importa ${importCount} →`
                  )}
                </button>
              </div>
            </>
          )}

          {/* FASE 3: Completato */}
          {step === 3 && importResult && (
            <>
              <div className="text-center py-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {importResult.imported} clienti importati con successo!
                </p>
                {skippedNoName > 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                    ⚠️ {skippedNoName} righe saltate (nome mancante)
                  </p>
                )}
                {skippedDup > 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                    ⚠️ {skippedDup} righe saltate (email duplicata)
                  </p>
                )}
                {importResult.errors > 0 && importResult.errorMessage && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    Errore: {importResult.errorMessage}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onSuccess();
                }}
                className="w-full py-3 px-4 bg-[#EEBA2B] text-black rounded-xl font-medium hover:bg-[#d4a826] transition-colors"
              >
                Chiudi e vai alla lista clienti
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
