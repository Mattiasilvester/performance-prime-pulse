
import { Notes as NotesComponent } from '@/components/notes/Notes';
import { AppLayout } from '@/components/layout/AppLayout';

const Notes = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <NotesComponent />
      </div>
    </AppLayout>
  );
};

export default Notes;
