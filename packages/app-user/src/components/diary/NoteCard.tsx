import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { categoryIcons, categoryLabels, type DiaryNote } from "@/lib/diaryNotesStorage";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface NoteCardProps {
  note: DiaryNote;
  onToggleHighlight: (id: string) => void;
  onDelete: (id: string) => void;
}

export const NoteCard = ({ note, onToggleHighlight, onDelete }: NoteCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const shouldTruncate = note.content.length > 120;
  const displayContent = !isExpanded && shouldTruncate 
    ? note.content.slice(0, 120) + "..." 
    : note.content;

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const startX = e.currentTarget.getBoundingClientRect().left;
    const currentX = touch.clientX;
    const delta = currentX - startX - 20;
    setSwipeX(Math.max(-150, Math.min(150, delta)));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (swipeX < -80) {
      // Swipe left - toggle highlight
      onToggleHighlight(note.id);
    } else if (swipeX > 80) {
      // Swipe right - delete
      onDelete(note.id);
    }
    
    setSwipeX(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const delta = e.clientX - rect.left - 20;
    setSwipeX(Math.max(-150, Math.min(150, delta)));
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    setIsDragging(false);
    
    if (swipeX < -80) {
      onToggleHighlight(note.id);
    } else if (swipeX > 80) {
      onDelete(note.id);
    }
    
    setSwipeX(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setSwipeX(0);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Swipe indicators */}
      <div
        className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none"
        style={{
          opacity: Math.abs(swipeX) / 100,
        }}
      >
        <div className="text-2xl opacity-0" style={{ opacity: swipeX > 0 ? 1 : 0 }}>
          🗑️
        </div>
        <div className="text-2xl opacity-0" style={{ opacity: swipeX < 0 ? 1 : 0 }}>
          ⭐
        </div>
      </div>

      {/* Card */}
      <Card
        className="relative bg-card border-border cursor-pointer transition-all hover:border-primary/50 select-none"
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: isDragging ? "none" : "transform 0.3s ease-out",
          backgroundColor: swipeX > 80 ? "hsl(var(--destructive) / 0.1)" : swipeX < -80 ? "hsl(var(--primary) / 0.1)" : undefined,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          if (!isDragging && Math.abs(swipeX) < 10) {
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(note.createdAt), "dd MMM yyyy", { locale: it })}
                </span>
                <Badge variant="outline" className="text-xs">
                  {categoryIcons[note.category]} {categoryLabels[note.category]}
                </Badge>
              </div>
              
              {(note.isPinned || note.isHighlighted) && (
                <div className="flex gap-2">
                  {note.isPinned && (
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      📌 Pinnata
                    </Badge>
                  )}
                  {note.isHighlighted && (
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      ⭐ In evidenza
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {displayContent}
            {shouldTruncate && !isExpanded && (
              <span className="text-primary ml-2 font-medium">Leggi tutto</span>
            )}
          </p>
        </div>
      </Card>
    </div>
  );
};

