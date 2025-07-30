
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { validateInput, sanitizeText, sanitizeHtml } from '@/lib/security';
import { toast } from 'sonner';

interface CustomPlanModalProps {
  onClose: () => void;
  onSave: (planData: any) => void;
}

export const CustomPlanModal: React.FC<CustomPlanModalProps> = ({ onClose, onSave }) => {
  const [planData, setPlanData] = useState({
    title: '',
    goal: '',
    details: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Validate title
    if (planData.title && !validateInput.textLength(planData.title, 100)) {
      newErrors.title = 'Il titolo non può superare i 100 caratteri';
    }
    if (planData.title && !validateInput.noScriptTags(planData.title)) {
      newErrors.title = 'Il titolo contiene contenuto non valido';
    }

    // Validate details
    if (planData.details && !validateInput.textLength(planData.details, 500)) {
      newErrors.details = 'I dettagli non possono superare i 500 caratteri';
    }
    if (planData.details && !validateInput.noScriptTags(planData.details)) {
      newErrors.details = 'I dettagli contengono contenuto non valido';
    }

    // Validate goal selection
    if (!planData.goal) {
      newErrors.goal = 'Seleziona un obiettivo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast.error('Correggi gli errori nel modulo prima di continuare');
      return;
    }

    // Sanitize inputs before saving
    const sanitizedData = {
      title: sanitizeText(planData.title),
      goal: planData.goal, // Goal is from select, already safe
      details: sanitizeHtml(planData.details),
    };

    onSave(sanitizedData);
  };

  const handleInputChange = (field: string, value: string) => {
    setPlanData({ ...planData, [field]: value });
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-black border-[#EEBA2B]">
        <DialogHeader>
          <DialogTitle className="text-[#EEBA2B] text-xl">
            Crea Piano Personalizzato
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="plan-title" className="text-[#EEBA2B]">Titolo Allenamento (opzionale)</Label>
            <Input
              id="plan-title"
              value={planData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Es. Allenamento Forza Base"
              className={`bg-[#333333] border-[#EEBA2B] text-white ${errors.title ? 'border-red-500' : ''}`}
              maxLength={100}
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal" className="text-[#EEBA2B]">Cosa vuoi migliorare? *</Label>
            <Select onValueChange={(value) => handleInputChange('goal', value)}>
              <SelectTrigger className={`bg-[#333333] border-[#EEBA2B] text-white ${errors.goal ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Seleziona il tuo obiettivo" />
              </SelectTrigger>
              <SelectContent className="bg-[#333333] border-[#EEBA2B]">
                <SelectItem value="forza">Aumentare la Forza</SelectItem>
                <SelectItem value="resistenza">Migliorare la Resistenza</SelectItem>
                <SelectItem value="perdita-peso">Perdita di Peso</SelectItem>
                <SelectItem value="massa-muscolare">Aumento Massa Muscolare</SelectItem>
                <SelectItem value="tonificazione">Tonificazione</SelectItem>
                <SelectItem value="flessibilita">Migliorare la Flessibilità</SelectItem>
                <SelectItem value="condizionamento">Condizionamento Generale</SelectItem>
              </SelectContent>
            </Select>
            {errors.goal && <p className="text-red-500 text-sm mt-1">{errors.goal}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="details" className="text-[#EEBA2B]">Dettagli aggiuntivi (opzionale)</Label>
            <Textarea
              id="details"
              value={planData.details}
              onChange={(e) => handleInputChange('details', e.target.value)}
              placeholder="Aggiungi dettagli specifici come tempo disponibile, attrezzature, preferenze..."
              className={`bg-[#333333] border-[#EEBA2B] text-white ${errors.details ? 'border-red-500' : ''}`}
              rows={3}
              maxLength={500}
            />
            {errors.details && <p className="text-red-500 text-sm mt-1">{errors.details}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[#EEBA2B] text-[#EEBA2B]">
            Annulla
          </Button>
          <Button 
            onClick={handleSave} 
            className="btn-primary"
            disabled={!planData.goal}
          >
            Genera Piano
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
