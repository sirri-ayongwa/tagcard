import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, MapPin, Briefcase, Globe, Mail, Phone, Share2, MessageCircle, Twitter, Instagram, Facebook, Send, Heart, ThumbsDown } from "lucide-react";
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
        await supabase.from('profile_views').insert({
          profile_id: profileData.id,
          referrer: document.referrer,
          user_agent: navigator.userAgent,
        });

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
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-muted to-background h-48" />
        <div className="relative max-w-2xl mx-auto px-4 pt-12 pb-8">
          {/* Avatar with ring */}
          <div className="flex flex-col items-center animate-fade-in">
            <div className="relative mb-6">
              <div className="absolute -inset-1 bg-foreground rounded-full opacity-10" />
              <Avatar className="h-28 w-28 ring-4 ring-background shadow-xl">
                <AvatarImage src={profile.avatar_url} className="object-cover" />
                <AvatarFallback className="text-3xl font-bold bg-foreground text-background">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <h1 className="text-3xl font-bold mb-2 text-center">{displayName}</h1>
            
            {profile.job_title && (
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Briefcase size={16} />
                <span className="font-medium">{profile.job_title}</span>
                {profile.company && <span>at {profile.company}</span>}
              </div>
            )}

            {profile.location && (
              <div className="flex items-center gap-2 text-muted-foreground mb-6">
                <MapPin size={16} />
                <span>{profile.location}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 w-full max-w-xs">
              <Button 
                onClick={handleShare} 
                variant="outline" 
                className="flex-1 h-12 rounded-xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Share2 size={18} className="mr-2" />
                Share
              </Button>
              {profile.show_contact_info && (
                <Button 
                  onClick={downloadVCard} 
                  className="flex-1 h-12 rounded-xl font-medium bg-foreground text-background hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download size={18} className="mr-2" />
                  Save
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search this profile..."
            className="pl-11 h-12 rounded-xl bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-foreground/20"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 space-y-8 pb-12">
        {/* Bio */}
        {(profile.short_bio || profile.long_bio) && (
          <section className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-foreground rounded-full" />
              About
            </h2>
            <div className="p-5 bg-card border rounded-2xl">
              <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">{bio}</p>
            </div>
          </section>
        )}

        {/* Likes */}
        {likes.length > 0 && (
          <section className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Heart size={18} className="text-foreground" />
              Likes
            </h2>
            <div className="flex flex-wrap gap-2">
              {likes.map((tag, index) => (
                <span 
                  key={tag.id} 
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-muted text-foreground border border-border transition-all hover:bg-foreground hover:text-background hover:scale-105 cursor-default"
                  style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Dislikes */}
        {dislikes.length > 0 && (
          <section className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              <ThumbsDown size={18} className="text-foreground" />
              Dislikes
            </h2>
            <div className="flex flex-wrap gap-2">
              {dislikes.map((tag, index) => (
                <span 
                  key={tag.id} 
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-foreground text-background transition-all hover:opacity-80 hover:scale-105 cursor-default"
                  style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Contact Info */}
        {profile.show_contact_info && (profile.email || profile.phone || profile.website) && (
          <section className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-foreground rounded-full" />
              Contact
            </h2>
            <div className="space-y-2">
              {profile.email && (
                <a 
                  href={`mailto:${profile.email}`} 
                  className="flex items-center gap-4 p-4 bg-card border rounded-xl hover:bg-muted transition-all hover:scale-[1.01] group"
                >
                  <div className="p-2 bg-muted rounded-lg group-hover:bg-foreground group-hover:text-background transition-colors">
                    <Mail size={18} />
                  </div>
                  <span className="font-medium">{profile.email}</span>
                </a>
              )}
              {profile.phone && (
                <a 
                  href={`tel:${profile.phone}`} 
                  className="flex items-center gap-4 p-4 bg-card border rounded-xl hover:bg-muted transition-all hover:scale-[1.01] group"
                >
                  <div className="p-2 bg-muted rounded-lg group-hover:bg-foreground group-hover:text-background transition-colors">
                    <Phone size={18} />
                  </div>
                  <span className="font-medium">{profile.phone}</span>
                </a>
              )}
              {profile.website && (
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-4 p-4 bg-card border rounded-xl hover:bg-muted transition-all hover:scale-[1.01] group"
                >
                  <div className="p-2 bg-muted rounded-lg group-hover:bg-foreground group-hover:text-background transition-colors">
                    <Globe size={18} />
                  </div>
                  <span className="font-medium">{profile.website}</span>
                </a>
              )}
            </div>
          </section>
        )}

        {/* Social Links */}
        {profile.show_social_links && socialLinks.length > 0 && (
          <section className="animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-foreground rounded-full" />
              Social
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-card border rounded-xl hover:bg-muted transition-all hover:scale-[1.02] group"
                >
                  <span className="font-medium">{link.platform}</span>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t mt-8">
        <div className="max-w-2xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          Built with ❤ by{" "}
          <a
            href="https://ko-fi.com/sirri"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline hover:no-underline transition-all"
          >
            Sirri
          </a>
        </div>
      </footer>

      {/* Social Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">Share Profile</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            <button
              onClick={() => shareToSocial('whatsapp')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-muted transition-all hover:scale-105"
            >
              <div className="p-3 bg-green-500/10 rounded-full">
                <MessageCircle className="h-7 w-7 text-green-600" />
              </div>
              <span className="text-xs font-medium">WhatsApp</span>
            </button>
            <button
              onClick={() => shareToSocial('snapchat')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-muted transition-all hover:scale-105"
            >
              <div className="p-3 bg-yellow-500/10 rounded-full">
                <Send className="h-7 w-7 text-yellow-500" />
              </div>
              <span className="text-xs font-medium">Snapchat</span>
            </button>
            <button
              onClick={() => shareToSocial('twitter')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-muted transition-all hover:scale-105"
            >
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Twitter className="h-7 w-7 text-blue-400" />
              </div>
              <span className="text-xs font-medium">Twitter</span>
            </button>
            <button
              onClick={() => shareToSocial('instagram')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-muted transition-all hover:scale-105"
            >
              <div className="p-3 bg-pink-500/10 rounded-full">
                <Instagram className="h-7 w-7 text-pink-600" />
              </div>
              <span className="text-xs font-medium">Instagram</span>
            </button>
            <button
              onClick={() => shareToSocial('facebook')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-muted transition-all hover:scale-105"
            >
              <div className="p-3 bg-blue-600/10 rounded-full">
                <Facebook className="h-7 w-7 text-blue-600" />
              </div>
              <span className="text-xs font-medium">Facebook</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicProfile;
