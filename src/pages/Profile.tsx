
import { Profile as ProfileComponent } from '@/components/profile/Profile';
import { AppLayout } from '@/components/layout/AppLayout';
import FeedbackWidget from '@/components/feedback/FeedbackWidget';

const Profile = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <ProfileComponent />
      </div>
      <FeedbackWidget />
    </AppLayout>
  );
};

export default Profile;
