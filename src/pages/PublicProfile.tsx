import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, MapPin, Briefcase, Globe, Mail, Phone, Share2, MessageCircle, Twitter, Instagram, Facebook, Send } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Profile {
  full_name: string;
  display_name?: string;
  avatar_url?: string;
  job_title?: string;
  company?: string;
  short_bio?: string;
  long_bio?: string;
  email?: string;
  phone?: string;
  website?: string;
  location?: string;
  show_contact_info: boolean;
  show_social_links: boolean;
}

interface Tag {
  id: string;
  name: string;
  tag_type: string;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

const PublicProfile = () => {
  const { publicId } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  useEffect(() => {
    loadProfile();
    trackView();
  }, [publicId]);

  const loadProfile = async () => {
    if (!publicId) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('public_id', publicId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      const { data: tagsData } = await supabase
        .from('tags')
        .select('*')
        .eq('profile_id', profileData.id);
      setTags(tagsData || []);

      const { data: socialData } = await supabase
        .from('social_links')
        .select('*')
        .eq('profile_id', profileData.id);
      setSocialLinks(socialData || []);
    } catch (error: any) {
      toast.error("Profile not found");
    } finally {
      setLoading(false);
    }
  };

  const trackView = async () => {
    if (!publicId) return;

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, profile_views')
        .eq('public_id', publicId)
        .single();

      if (profileData) {
        // Insert view record
        await supabase.from('profile_views').insert({
          profile_id: profileData.id,
          referrer: document.referrer,
          user_agent: navigator.userAgent,
        });

        // Increment profile view count
        await supabase
          .from('profiles')
          .update({ profile_views: (profileData.profile_views || 0) + 1 })
          .eq('id', profileData.id);
      }
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  };

  const downloadVCard = () => {
    if (!profile) return;

    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${profile.full_name}
N:${profile.full_name};;;
${profile.job_title ? `TITLE:${profile.job_title}\n` : ''}
${profile.company ? `ORG:${profile.company}\n` : ''}
${profile.email ? `EMAIL:${profile.email}\n` : ''}
${profile.phone ? `TEL:${profile.phone}\n` : ''}
${profile.website ? `URL:${profile.website}\n` : ''}
${profile.location ? `ADR:;;${profile.location};;;;\n` : ''}
END:VCARD`;

    const blob = new Blob([vCard], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.full_name.replace(/\s/g, '_')}.vcf`;
    a.click();
    toast.success("Contact saved!");
  };

  const handleShare = () => {
    setShareDialogOpen(true);
  };

  const shareToSocial = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out ${profile?.display_name || profile?.full_name}'s TagCard profile!`);
    
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      snapchat: `https://www.snapchat.com/scan?attachmentUrl=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      instagram: `https://www.instagram.com/`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    };

    if (platform === 'instagram') {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied! Share it on Instagram.");
    } else {
      window.open(urls[platform], '_blank');
    }
    setShareDialogOpen(false);
  };

  const filteredContent = () => {
    if (!searchQuery) return { tags, bio: profile?.long_bio || profile?.short_bio || '' };

    const query = searchQuery.toLowerCase();
    const filteredTags = tags.filter(tag => tag.name.toLowerCase().includes(query));
    const bio = profile?.long_bio || profile?.short_bio || '';
    
    return { tags: filteredTags, bio };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Profile not found</h1>
          <p className="text-muted-foreground">This profile doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const displayName = profile.display_name || profile.full_name;
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const { tags: filteredTags, bio } = filteredContent();
  const likes = filteredTags.filter(t => t.tag_type === 'like');
  const dislikes = filteredTags.filter(t => t.tag_type === 'dislike');

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-2xl mx-auto px-4 py-6 text-center">
          <Avatar className="h-24 w-24 mx-auto mb-4">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          
          <h1 className="text-2xl font-bold mb-1">{displayName}</h1>
          
          {profile.job_title && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
              <Briefcase size={16} />
              <span>{profile.job_title}</span>
              {profile.company && <span>at {profile.company}</span>}
            </div>
          )}

          {profile.location && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
              <MapPin size={16} />
              <span>{profile.location}</span>
            </div>
          )}

          <div className="flex gap-2 justify-center">
            <Button onClick={handleShare} variant="outline">
              <Share2 size={16} className="mr-2" />
              Share
            </Button>
            {profile.show_contact_info && (
              <Button onClick={downloadVCard} className="btn-primary">
                <Download size={16} className="mr-2" />
                Save Contact
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search this profile..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Bio */}
        {(profile.short_bio || profile.long_bio) && (
          <div>
            <h2 className="font-bold text-lg mb-3">About</h2>
            <p className="text-foreground/80 whitespace-pre-wrap">{bio}</p>
          </div>
        )}

        {/* Likes */}
        {likes.length > 0 && (
          <div>
            <h2 className="font-bold text-lg mb-3">Likes</h2>
            <div className="flex flex-wrap gap-2">
              {likes.map((tag) => (
                <span key={tag.id} className="tag-pill">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dislikes */}
        {dislikes.length > 0 && (
          <div>
            <h2 className="font-bold text-lg mb-3">Dislikes</h2>
            <div className="flex flex-wrap gap-2">
              {dislikes.map((tag) => (
                <span key={tag.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-black text-white">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contact Info */}
        {profile.show_contact_info && (profile.email || profile.phone || profile.website) && (
          <div>
            <h2 className="font-bold text-lg mb-3">Contact</h2>
            <div className="space-y-2">
              {profile.email && (
                <a href={`mailto:${profile.email}`} className="flex items-center gap-3 p-3 border rounded-xl hover:bg-muted transition-colors">
                  <Mail size={18} />
                  <span>{profile.email}</span>
                </a>
              )}
              {profile.phone && (
                <a href={`tel:${profile.phone}`} className="flex items-center gap-3 p-3 border rounded-xl hover:bg-muted transition-colors">
                  <Phone size={18} />
                  <span>{profile.phone}</span>
                </a>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border rounded-xl hover:bg-muted transition-colors">
                  <Globe size={18} />
                  <span>{profile.website}</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Social Links */}
        {profile.show_social_links && socialLinks.length > 0 && (
          <div>
            <h2 className="font-bold text-lg mb-3">Social</h2>
            <div className="space-y-2">
              {socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border rounded-xl hover:bg-muted transition-colors"
                >
                  <span className="font-medium">{link.platform}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-2xl mx-auto px-4 mt-12 text-center text-sm text-muted-foreground">
        Built with ❤ by{" "}
        <a
          href="https://ko-fi.com/sirri"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground hover:underline"
        >
          Sirri
        </a>
      </div>

      {/* Social Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Profile</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            <button
              onClick={() => shareToSocial('whatsapp')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted transition-colors"
            >
              <MessageCircle className="h-8 w-8 text-green-600" />
              <span className="text-xs">WhatsApp</span>
            </button>
            <button
              onClick={() => shareToSocial('snapchat')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted transition-colors"
            >
              <Send className="h-8 w-8 text-yellow-400" />
              <span className="text-xs">Snapchat</span>
            </button>
            <button
              onClick={() => shareToSocial('twitter')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted transition-colors"
            >
              <Twitter className="h-8 w-8 text-blue-400" />
              <span className="text-xs">Twitter</span>
            </button>
            <button
              onClick={() => shareToSocial('instagram')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted transition-colors"
            >
              <Instagram className="h-8 w-8 text-pink-600" />
              <span className="text-xs">Instagram</span>
            </button>
            <button
              onClick={() => shareToSocial('facebook')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted transition-colors"
            >
              <Facebook className="h-8 w-8 text-blue-600" />
              <span className="text-xs">Facebook</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicProfile;
