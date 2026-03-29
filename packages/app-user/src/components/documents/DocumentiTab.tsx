import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  FileImage,
  File,
  Upload,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import {
  userDocumentsService,
  type DocumentCategory,
  type UserDocument,
  DOCUMENT_CATEGORY_LABELS,
} from '@/services/userDocumentsService';

const CATEGORY_STYLES: Record<DocumentCategory, string> = {
  scheda_pt: 'bg-[#EEBA2B]/20 text-[#EEBA2B] border border-[#EEBA2B]/40',
  piano_nutrizione: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40',
  documento_medico: 'bg-blue-500/20 text-blue-300 border border-blue-400/40',
  altro: 'bg-white/10 text-[#8A8A96] border border-white/20',
};

function getFileIcon(fileType: string) {
  if (fileType === 'application/pdf') {
    return <FileText className="h-5 w-5 text-red-400" />;
  }
  if (fileType.startsWith('image/')) {
    return <FileImage className="h-5 w-5 text-blue-300" />;
  }
  return <File className="h-5 w-5 text-[#8A8A96]" />;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

type ParsedWorkoutJson = NonNullable<UserDocument['workout_json']>;

export default function DocumentiTab() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('altro');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [renameTarget, setRenameTarget] = useState<UserDocument | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<UserDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [parsingDocId, setParsingDocId] = useState<string | null>(null);
  const [parsedWorkout, setParsedWorkout] = useState<ParsedWorkoutJson | null>(null);
  const [showDaysModal, setShowDaysModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<UserDocument | null>(null);

  const canSubmitUpload = useMemo(() => {
    return uploadName.trim().length > 0 && uploadCategory && uploadFile;
  }, [uploadName, uploadCategory, uploadFile]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await userDocumentsService.getDocuments();
      data.sort((a, b) => {
        if (a.source === 'pt' && b.source !== 'pt') return -1;
        if (a.source !== 'pt' && b.source === 'pt') return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setDocuments(data);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Impossibile caricare i documenti.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, []);

  const resetUploadForm = () => {
    setUploadName('');
    setUploadCategory('altro');
    setUploadFile(null);
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    setIsUploading(true);
    try {
      const created = await userDocumentsService.uploadDocument(
        uploadFile,
        uploadName,
        uploadCategory
      );
      setDocuments((prev) => [created, ...prev]);
      toast.success('Documento caricato con successo.');
      setIsUploadOpen(false);
      resetUploadForm();
    } catch (error) {
      console.error('Error uploading document:', error);
      const message =
        error instanceof Error ? error.message : 'Errore durante il caricamento.';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleView = async (doc: UserDocument) => {
    try {
      const signedUrl = await userDocumentsService.getSignedUrl(doc.file_path);
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error opening document:', error);
      toast.error('Impossibile visualizzare il documento.');
    }
  };

  const handleOpenRename = (doc: UserDocument) => {
    setRenameTarget(doc);
    setRenameValue(doc.name);
  };

  const handleRename = async () => {
    if (!renameTarget) return;
    if (!renameValue.trim()) {
      toast.error('Inserisci un nome valido.');
      return;
    }

    setIsRenaming(true);
    try {
      await userDocumentsService.renameDocument(renameTarget.id, renameValue);
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === renameTarget.id
            ? { ...doc, name: renameValue.trim(), updated_at: new Date().toISOString() }
            : doc
        )
      );
      toast.success('Documento rinominato.');
      setRenameTarget(null);
      setRenameValue('');
    } catch (error) {
      console.error('Error renaming document:', error);
      toast.error('Impossibile rinominare il documento.');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await userDocumentsService.deleteDocument(deleteTarget);
      setDocuments((prev) => prev.filter((doc) => doc.id !== deleteTarget.id));
      toast.success('Documento eliminato.');
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Impossibile eliminare il documento.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectDay = (dayIndex: number) => {
    if (!parsedWorkout || !selectedDoc) return;
    setShowDaysModal(false);

    const syntheticPlan = {
      id: `pt-doc-${selectedDoc.id}`,
      name: selectedDoc.name,
      workouts: parsedWorkout.giorni.map((giorno) => ({
        name: giorno.nome,
        esercizi: giorno.esercizi.map((ex) => ({
          nome: ex.nome,
          serie: ex.serie,
          ripetizioni: ex.ripetizioni,
          rest: ex.recupero ?? '60s',
          note: ex.note,
        })),
      })),
    };

    navigate('/esecuzione-workout', {
      state: { plan: syntheticPlan, dayIndex },
    });
  };

  const handleStartWorkout = async (doc: UserDocument) => {
    if (doc.workout_json && doc.parsing_status === 'done') {
      setParsedWorkout(doc.workout_json);
      setSelectedDoc(doc);
      setShowDaysModal(true);
      return;
    }

    setParsingDocId(doc.id);
    try {
      if (doc.parsing_status === 'error') {
        await userDocumentsService.resetParsingStatus(doc.id);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error('Sessione non valida. Effettua di nuovo il login.');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-workout-pdf`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ document_id: doc.id }),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            success?: boolean;
            cached?: boolean;
            status?: 'processing';
            workout_json?: ParsedWorkoutJson;
            error?: { message?: string };
          }
        | null;

      if (result?.status === 'processing') {
        toast.info('Analisi in corso, riprova tra qualche secondo');
        return;
      }

      if (!result?.success) {
        const message = result?.error?.message ?? 'Errore durante analisi scheda';
        toast.error(message);
        return;
      }

      const workoutJson = result.workout_json;
      if (!workoutJson || !Array.isArray(workoutJson.giorni) || workoutJson.giorni.length === 0) {
        toast.error('Impossibile estrarre esercizi dal PDF');
        return;
      }

      setDocuments((prev) =>
        prev.map((item) =>
          item.id === doc.id
            ? { ...item, workout_json: workoutJson, parsing_status: 'done', parse_error: null }
            : item
        )
      );

      setParsedWorkout(workoutJson);
      setSelectedDoc({ ...doc, workout_json: workoutJson, parsing_status: 'done', parse_error: null });
      setShowDaysModal(true);
    } catch (error) {
      console.error('Error parsing workout PDF:', error);
      toast.error('Errore durante analisi scheda');
    } finally {
      setParsingDocId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#F0EDE8]">I miei documenti</h2>
          <p className="text-sm text-[#8A8A96]">
            Carica PDF e immagini personali per averli sempre a portata di mano.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setIsUploadOpen(true)}
          className="bg-transparent border border-[#EEBA2B] text-[#EEBA2B] hover:bg-[#EEBA2B]/10 whitespace-nowrap shrink-0 px-3 py-1.5 text-sm"
        >
          <Upload className="w-3.5 h-3.5 mr-2" />
          Carica documento
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-[#16161A] border border-white/10 rounded-xl p-8 flex items-center justify-center gap-3 text-[#8A8A96]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Caricamento documenti...
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-[#16161A] border border-white/10 rounded-xl p-10 text-center">
          <FileText className="h-10 w-10 text-[#8A8A96] mx-auto mb-3" />
          <p className="text-[#F0EDE8] font-medium">Nessun documento caricato</p>
          <p className="text-sm text-[#8A8A96] mt-1 mb-5">
            Aggiungi le tue schede, piani e documenti per consultarli rapidamente.
          </p>
          <Button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="bg-transparent border border-[#EEBA2B] text-[#EEBA2B] hover:bg-[#EEBA2B]/10"
          >
            Carica il tuo primo documento
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-[#16161A] border border-white/10 rounded-xl p-4 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5">{getFileIcon(doc.file_type)}</div>
                <div className="min-w-0">
                  <p className="text-[#F0EDE8] font-medium truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_STYLES[doc.category]}`}
                    >
                      {DOCUMENT_CATEGORY_LABELS[doc.category]}
                    </span>
                    {doc.source === 'pt' && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px]"
                        style={{ backgroundColor: 'rgba(55, 138, 221, 0.15)', color: '#378ADD' }}
                      >
                        Dal tuo PT
                      </span>
                    )}
                    <span className="text-xs text-[#8A8A96]">
                      {userDocumentsService.formatFileSize(doc.file_size)}
                    </span>
                    <span className="text-xs text-[#8A8A96]">•</span>
                    <span className="text-xs text-[#8A8A96]">{formatDate(doc.created_at)}</span>
                  </div>
                  {doc.category === 'scheda_pt' && (
                    <Button
                      type="button"
                      onClick={() => void handleStartWorkout(doc)}
                      disabled={parsingDocId === doc.id}
                      className={`mt-2 w-fit rounded-lg px-3 py-1 text-xs font-medium flex items-center gap-1.5 ${
                        parsingDocId === doc.id
                          ? 'border border-[#EEBA2B]/50 text-[#EEBA2B]/50 bg-transparent hover:bg-transparent'
                          : 'border border-[#EEBA2B] text-[#EEBA2B] bg-transparent hover:bg-[#EEBA2B]/10'
                      }`}
                    >
                      {parsingDocId === doc.id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Analisi...
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" />
                          Inizia allenamento
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleView(doc)}
                  className="text-[#8A8A96] hover:text-[#F0EDE8] hover:bg-white/10"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {doc.source !== 'pt' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenRename(doc)}
                    className="text-[#8A8A96] hover:text-[#F0EDE8] hover:bg-white/10"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(doc)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={isUploadOpen}
        onOpenChange={(open) => {
          setIsUploadOpen(open);
          if (!open) resetUploadForm();
        }}
      >
        <DialogContent className="bg-[#16161A] border border-white/10 max-w-[calc(100vw-2rem)] mx-auto">
          <DialogHeader>
            <DialogTitle className="text-[#F0EDE8]">Carica documento</DialogTitle>
            <DialogDescription className="text-[#8A8A96]">
              Seleziona nome, categoria e file
              <br className="sm:hidden" />
              {' '}(PDF, JPG, PNG, WEBP — max 10MB).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#F0EDE8]" htmlFor="doc-name">
                Nome documento
              </Label>
              <Input
                id="doc-name"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="Es. Scheda petto marzo"
                className="bg-[#0A0A0C] border-white/10 text-[#F0EDE8]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#F0EDE8]">Categoria</Label>
              <Select
                value={uploadCategory}
                onValueChange={(value) => setUploadCategory(value as DocumentCategory)}
              >
                <SelectTrigger className="bg-[#0A0A0C] border-white/10 text-[#F0EDE8]">
                  <SelectValue placeholder="Seleziona categoria" />
                </SelectTrigger>
                <SelectContent className="bg-[#16161A] border border-white/10 text-[#F0EDE8]">
                  <SelectItem value="scheda_pt">Scheda PT</SelectItem>
                  <SelectItem value="piano_nutrizione">Piano nutrizione</SelectItem>
                  <SelectItem value="documento_medico">Documento medico</SelectItem>
                  <SelectItem value="altro">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[#F0EDE8]" htmlFor="doc-file">
                File
              </Label>
              <div className="flex items-center h-11 w-full rounded-lg border border-white/10 bg-[#0A0A0C] px-3">
                <input
                  id="doc-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="sr-only"
                />
                <label
                  htmlFor="doc-file"
                  className="inline-flex items-center rounded-lg px-3 py-1 text-sm font-medium bg-[#EEBA2B]/10 text-[#EEBA2B] cursor-pointer whitespace-nowrap"
                >
                  Scegli file
                </label>
                <span className="ml-3 text-sm text-[#8A8A96] truncate">
                  {uploadFile?.name ?? 'Nessun file selezionato'}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsUploadOpen(false)}
              className="border-white/20 text-[#8A8A96] hover:bg-white/10"
              disabled={isUploading}
            >
              Annulla
            </Button>
            <Button
              onClick={() => void handleUpload()}
              disabled={!canSubmitUpload || isUploading}
              className="bg-transparent border border-[#EEBA2B] text-[#EEBA2B] hover:bg-[#EEBA2B]/10"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Caricamento...
                </>
              ) : (
                'Carica'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDaysModal} onOpenChange={setShowDaysModal}>
        <DialogContent className="mx-auto w-[calc(100%-2rem)] bg-[#16161A] border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-[#F0EDE8]">Scegli il giorno</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            {parsedWorkout?.giorni.map((giorno, index) => (
              <button
                key={index}
                onClick={() => handleSelectDay(index)}
                className="w-full text-left p-4 rounded-xl bg-[#16161A] border border-white/10 hover:border-[#EEBA2B]/50 transition-colors"
              >
                <div className="text-sm font-medium text-white">{giorno.nome}</div>
                <div className="text-xs text-[#8A8A96] mt-1">
                  {giorno.esercizi.length} esercizi
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="bg-[#16161A] border border-white/10 max-w-[calc(100vw-2rem)] mx-auto">
          <DialogHeader>
            <DialogTitle className="text-[#F0EDE8]">Rinomina documento</DialogTitle>
            <DialogDescription className="text-[#8A8A96]">
              Inserisci il nuovo nome del documento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label className="text-[#F0EDE8]" htmlFor="rename-doc">
              Nome
            </Label>
            <Input
              id="rename-doc"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="bg-[#0A0A0C] border-white/10 text-[#F0EDE8]"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRenameTarget(null)}
              className="border-white/20 text-[#8A8A96] hover:bg-white/10"
              disabled={isRenaming}
            >
              Annulla
            </Button>
            <Button
              onClick={() => void handleRename()}
              disabled={isRenaming || !renameValue.trim()}
              className="bg-transparent border border-[#EEBA2B] text-[#EEBA2B] hover:bg-[#EEBA2B]/10"
            >
              {isRenaming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                'Salva'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="bg-[#16161A] border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-[#F0EDE8]">Elimina documento</DialogTitle>
            <DialogDescription className="text-[#8A8A96]">
              Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm text-[#F0EDE8]">
            Confermi l&apos;eliminazione di{' '}
            <span className="text-[#EEBA2B] font-medium">{deleteTarget?.name}</span>?
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="border-white/20 text-[#8A8A96] hover:bg-white/10"
              disabled={isDeleting}
            >
              Annulla
            </Button>
            <Button
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="bg-red-500/20 border border-red-400/40 text-red-300 hover:bg-red-500/30"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminazione...
                </>
              ) : (
                'Elimina'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
