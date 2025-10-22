import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Share2, Download, Edit, Settings, Eye } from "lucide-react";
import { toast } from "sonner";
import QRModal from "@/components/QRModal";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { QRCodeSVG } from "qrcode.react";

interface Profile {
  id: string;
  full_name: string;
  display_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  company: string | null;
  short_bio: string | null;
  public_id: string;
  profile_views: number;
  email: string | null;
  phone: string | null;
  website: string | null;
}

interface Tag {
  id: string;
  name: string;
  tag_type: string;
}

const Dashboard = () => {
  const { user } = useAuth();
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

  const handleDownloadCard = async (format: 'pdf' | 'png') => {
    const cardElement = document.getElementById('business-card-preview');
    if (!cardElement) return;

    try {
      const canvas = await html2canvas(cardElement, {
        scale: 3,
        backgroundColor: '#ffffff',
      });

      if (format === 'png') {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `${profile?.full_name.replace(/\s/g, '_')}_card.png`;
        link.click();
        toast.success("Business card downloaded as PNG!");
      } else {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: [85, 55],
        });
        pdf.addImage(imgData, 'PNG', 0, 0, 85, 55);
        pdf.save(`${profile?.full_name.replace(/\s/g, '_')}_card.pdf`);
        toast.success("Business card downloaded as PDF!");
      }
    } catch (error) {
      toast.error("Failed to generate business card");
    }
  };

  const handleViewProfile = () => {
    if (profile) {
      window.open(`/p/${profile.public_id}`, '_blank');
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
  const profileUrl = `${window.location.origin}/p/${profile.public_id}`;

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

      {/* Hidden Business Card Preview */}
      <div id="business-card-preview" className="absolute -left-[9999px] w-[850px] h-[550px] bg-white p-8 flex flex-col justify-between">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-foreground flex items-center justify-center text-background text-2xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-foreground mb-2">{displayName}</h2>
            {profile?.job_title && (
              <p className="text-xl text-foreground/70">
                {profile.job_title}
                {profile?.company && ` at ${profile.company}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            {profile?.email && <p className="text-foreground/70">{profile.email}</p>}
            {profile?.phone && <p className="text-foreground/70">{profile.phone}</p>}
            {profile?.website && <p className="text-foreground/70">{profile.website}</p>}
          </div>
          <div className="w-32 h-32 bg-white p-2">
            <QRCodeSVG value={profileUrl} size={112} level="H" />
          </div>
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
              {profile.short_bio && (
                <p className="text-sm text-foreground/70 mt-2">{profile.short_bio}</p>
              )}
            </div>
          </div>

          {/* Likes */}
          {tags.filter(t => t.tag_type === 'like').length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Likes</h3>
              <div className="flex flex-wrap gap-2">
                {tags.filter(t => t.tag_type === 'like').slice(0, 8).map((tag) => (
                  <span key={tag.id} className="tag-pill text-sm">
                    {tag.name}
                  </span>
                ))}
                {tags.filter(t => t.tag_type === 'like').length > 8 && (
                  <span className="tag-pill text-sm">+{tags.filter(t => t.tag_type === 'like').length - 8}</span>
                )}
              </div>
            </div>
          )}

          {/* Dislikes */}
          {tags.filter(t => t.tag_type === 'dislike').length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Dislikes</h3>
              <div className="flex flex-wrap gap-2">
                {tags.filter(t => t.tag_type === 'dislike').slice(0, 8).map((tag) => (
                  <span key={tag.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-black text-white">
                    {tag.name}
                  </span>
                ))}
                {tags.filter(t => t.tag_type === 'dislike').length > 8 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-black text-white">+{tags.filter(t => t.tag_type === 'dislike').length - 8}</span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button onClick={handleShare} className="w-full btn-primary" size="lg">
              <Share2 className="mr-2" size={18} />
              Share Profile
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => handleDownloadCard('pdf')} variant="outline" size="lg">
                <Download className="mr-2" size={18} />
                PDF Card
              </Button>
              <Button onClick={() => handleDownloadCard('png')} variant="outline" size="lg">
                <Download className="mr-2" size={18} />
                PNG Card
              </Button>
            </div>

            <Button onClick={() => navigate("/edit-profile")} variant="outline" className="w-full" size="lg">
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
          open={showQRModal}
          onOpenChange={setShowQRModal}
          profileUrl={profileUrl}
        />
      )}
    </div>
  );
};

export default Dashboard;
