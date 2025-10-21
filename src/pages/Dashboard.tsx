import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Share2, Download, Edit, Settings, Eye } from "lucide-react";
import { toast } from "sonner";
import QRModal from "@/components/QRModal";

interface Profile {
  id: string;
  full_name: string;
  display_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  short_bio: string | null;
  public_id: string;
  profile_views: number;
}

interface Tag {
  id: string;
  name: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    loadProfile();
  }, [user, navigate]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .eq('profile_id', user.id);

      if (tagsError) throw tagsError;
      setTags(tagsData || []);
    } catch (error: any) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    setShowQRModal(true);
  };

  const handleDownloadCard = () => {
    toast.info("Business card export coming soon!");
  };

  const handleViewProfile = () => {
    if (profile) {
      window.open(`/profile/${profile.public_id}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
      </div>
    );
  }

  if (!profile) return null;

  const displayName = profile.display_name || profile.full_name;
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">TagCard Profile</h1>
          <button
            onClick={() => navigate("/settings")}
            className="icon-btn"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Card */}
        <div className="border rounded-2xl p-6 space-y-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{displayName}</h2>
              {profile.job_title && (
                <p className="text-muted-foreground">{profile.job_title}</p>
              )}
            </div>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag.id} className="tag-pill text-sm">
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button onClick={handleShare} className="btn-primary">
              <Share2 className="mr-2" size={18} />
              Share
            </Button>
            <Button onClick={handleDownloadCard} className="btn-secondary">
              <Download className="mr-2" size={18} />
              Download Card
            </Button>
            <Button onClick={() => navigate("/edit-profile")} className="btn-secondary">
              <Edit className="mr-2" size={18} />
              Edit Profile
            </Button>
          </div>

          {/* View Public Profile */}
          <button
            onClick={handleViewProfile}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eye size={16} />
            View public profile
          </button>
        </div>

        {/* Profile Stats */}
        <div className="border rounded-xl p-4">
          <h3 className="font-semibold mb-2">Profile Views</h3>
          <p className="text-3xl font-bold">{profile.profile_views}</p>
        </div>
      </div>

      {/* QR Modal */}
      {showQRModal && profile && (
        <QRModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          publicId={profile.public_id}
        />
      )}
    </div>
  );
};

export default Dashboard;
