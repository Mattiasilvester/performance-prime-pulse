
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

  const handleSave = () => {
    if (!planData.goal) return;
    onSave(planData);
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
              onChange={(e) => setPlanData({ ...planData, title: e.target.value })}
              placeholder="Es. Allenamento Forza Base"
              className="bg-[#333333] border-[#EEBA2B] text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal" className="text-[#EEBA2B]">Cosa vuoi migliorare? *</Label>
            <Select onValueChange={(value) => setPlanData({ ...planData, goal: value })}>
              <SelectTrigger className="bg-[#333333] border-[#EEBA2B] text-white">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="details" className="text-[#EEBA2B]">Dettagli aggiuntivi (opzionale)</Label>
            <Textarea
              id="details"
              value={planData.details}
              onChange={(e) => setPlanData({ ...planData, details: e.target.value })}
              placeholder="Aggiungi dettagli specifici come tempo disponibile, attrezzature, preferenze..."
              className="bg-[#333333] border-[#EEBA2B] text-white"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-brand-primary text-text-primary hover:bg-surface-secondary hover:text-text-primary">
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
