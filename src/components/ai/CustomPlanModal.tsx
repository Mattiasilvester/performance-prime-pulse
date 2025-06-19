
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CustomPlanModalProps {
  onClose: () => void;
  onSave: (planData: any) => void;
}

export const CustomPlanModal: React.FC<CustomPlanModalProps> = ({ onClose, onSave }) => {
  const [planData, setPlanData] = useState({
    name: '',
    goal: '',
    duration: '',
    frequency: '',
    level: '',
    description: '',
    exercises: [],
  });

  const handleSave = () => {
    onSave(planData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-black border-[#EEBA2B]">
        <DialogHeader>
          <DialogTitle className="text-[#EEBA2B] text-xl">
            Crea Piano Personalizzato
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#333333]">
            <TabsTrigger value="general" className="text-white data-[state=active]:bg-[#EEBA2B] data-[state=active]:text-black">
              Generale
            </TabsTrigger>
            <TabsTrigger value="exercises" className="text-white data-[state=active]:bg-[#EEBA2B] data-[state=active]:text-black">
              Esercizi
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-white data-[state=active]:bg-[#EEBA2B] data-[state=active]:text-black">
              Programmazione
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan-name" className="text-[#EEBA2B]">Nome Piano</Label>
                <Input
                  id="plan-name"
                  value={planData.name}
                  onChange={(e) => setPlanData({ ...planData, name: e.target.value })}
                  placeholder="Es. Piano Forza Base"
                  className="bg-[#333333] border-[#EEBA2B] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal" className="text-[#EEBA2B]">Obiettivo</Label>
                <Select onValueChange={(value) => setPlanData({ ...planData, goal: value })}>
                  <SelectTrigger className="bg-[#333333] border-[#EEBA2B] text-white">
                    <SelectValue placeholder="Seleziona obiettivo" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#333333] border-[#EEBA2B]">
                    <SelectItem value="strength">Forza</SelectItem>
                    <SelectItem value="endurance">Resistenza</SelectItem>
                    <SelectItem value="weight-loss">Perdita Peso</SelectItem>
                    <SelectItem value="muscle-gain">Aumento Massa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-[#EEBA2B]">Durata (settimane)</Label>
                <Select onValueChange={(value) => setPlanData({ ...planData, duration: value })}>
                  <SelectTrigger className="bg-[#333333] border-[#EEBA2B] text-white">
                    <SelectValue placeholder="Seleziona durata" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#333333] border-[#EEBA2B]">
                    <SelectItem value="4">4 settimane</SelectItem>
                    <SelectItem value="8">8 settimane</SelectItem>
                    <SelectItem value="12">12 settimane</SelectItem>
                    <SelectItem value="16">16 settimane</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency" className="text-[#EEBA2B]">Frequenza settimanale</Label>
                <Select onValueChange={(value) => setPlanData({ ...planData, frequency: value })}>
                  <SelectTrigger className="bg-[#333333] border-[#EEBA2B] text-white">
                    <SelectValue placeholder="Giorni/settimana" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#333333] border-[#EEBA2B]">
                    <SelectItem value="3">3 giorni</SelectItem>
                    <SelectItem value="4">4 giorni</SelectItem>
                    <SelectItem value="5">5 giorni</SelectItem>
                    <SelectItem value="6">6 giorni</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-[#EEBA2B]">Descrizione</Label>
              <Textarea
                id="description"
                value={planData.description}
                onChange={(e) => setPlanData({ ...planData, description: e.target.value })}
                placeholder="Descrivi il piano di allenamento..."
                className="bg-[#333333] border-[#EEBA2B] text-white"
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="exercises" className="space-y-4 mt-6">
            <div className="text-center py-8">
              <p className="text-white">Sezione esercizi in sviluppo</p>
              <p className="text-sm text-gray-400 mt-2">Qui potrai aggiungere e configurare gli esercizi specifici</p>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4 mt-6">
            <div className="text-center py-8">
              <p className="text-white">Sezione programmazione in sviluppo</p>
              <p className="text-sm text-gray-400 mt-2">Qui potrai impostare la programmazione settimanale</p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[#EEBA2B] text-[#EEBA2B]">
            Annulla
          </Button>
          <Button onClick={handleSave} className="btn-primary">
            Salva Piano
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
