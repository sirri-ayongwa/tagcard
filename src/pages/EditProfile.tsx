import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Camera, X, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const EditProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [shortBio, setShortBio] = useState("");
  const [longBio, setLongBio] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [showContactInfo, setShowContactInfo] = useState(true);
  const [showSocialLinks, setShowSocialLinks] = useState(true);

  // Tags
  const [likes, setLikes] = useState<Array<{ id: string; name: string }>>([]);
  const [dislikes, setDislikes] = useState<Array<{ id: string; name: string }>>([]);
  const [newLike, setNewLike] = useState("");
  const [newDislike, setNewDislike] = useState("");

  // Social links
  const [socialLinks, setSocialLinks] = useState<Array<{ id: string; platform: string; url: string }>>([]);

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }
    loadProfile();
  }, [user, authLoading]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || "");
        setDisplayName(profile.display_name || "");
        setAvatarUrl(profile.avatar_url || "");
        setJobTitle(profile.job_title || "");
        setCompany(profile.company || "");
        setShortBio(profile.short_bio || "");
        setLongBio(profile.long_bio || "");
        setEmail(profile.email || "");
        setPhone(profile.phone || "");
        setWebsite(profile.website || "");
        setLocation(profile.location || "");
        setShowContactInfo(profile.show_contact_info);
        setShowSocialLinks(profile.show_social_links);
      }

      const { data: tagsData } = await supabase
        .from('tags')
        .select('*')
        .eq('profile_id', user.id);
      
      const likesData = tagsData?.filter(t => t.tag_type === 'like') || [];
      const dislikesData = tagsData?.filter(t => t.tag_type === 'dislike') || [];
      setLikes(likesData);
      setDislikes(dislikesData);

      const { data: socialData } = await supabase
        .from('social_links')
        .select('*')
        .eq('profile_id', user.id);
      
      setSocialLinks(socialData || []);
    } catch (error: any) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);

      await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id);

      toast.success("Avatar updated!");
    } catch (error: any) {
      toast.error("Failed to upload avatar");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Remove the avatar from storage if it exists
      if (avatarUrl) {
        const filePath = `${user.id}/avatar.${avatarUrl.split('.').pop()}`;
        await supabase.storage.from('avatars').remove([filePath]);
      }

      // Update profile to remove avatar_url
      await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      setAvatarUrl("");
      toast.success("Avatar deleted!");
    } catch (error: any) {
      toast.error("Failed to delete avatar");
    } finally {
      setSaving(false);
    }
  };

  const addLike = async () => {
    if (!newLike.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({ profile_id: user.id, name: newLike.trim(), tag_type: 'like' })
        .select()
        .single();

      if (error) throw error;
      setLikes([...likes, data]);
      setNewLike("");
      toast.success("Like added!");
    } catch (error) {
      toast.error("Failed to add like");
    }
  };

  const addDislike = async () => {
    if (!newDislike.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({ profile_id: user.id, name: newDislike.trim(), tag_type: 'dislike' })
        .select()
        .single();

      if (error) throw error;
      setDislikes([...dislikes, data]);
      setNewDislike("");
      toast.success("Dislike added!");
    } catch (error) {
      toast.error("Failed to add dislike");
    }
  };

  const removeLike = async (tagId: string) => {
    try {
      await supabase.from('tags').delete().eq('id', tagId);
      setLikes(likes.filter(t => t.id !== tagId));
      toast.success("Like removed!");
    } catch (error) {
      toast.error("Failed to remove like");
    }
  };

  const removeDislike = async (tagId: string) => {
    try {
      await supabase.from('tags').delete().eq('id', tagId);
      setDislikes(dislikes.filter(t => t.id !== tagId));
      toast.success("Dislike removed!");
    } catch (error) {
      toast.error("Failed to remove dislike");
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          display_name: displayName || null,
          job_title: jobTitle || null,
          company: company || null,
          short_bio: shortBio || null,
          long_bio: longBio || null,
          email: email || null,
          phone: phone || null,
          website: website || null,
          location: location || null,
          show_contact_info: showContactInfo,
          show_social_links: showSocialLinks,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Profile updated!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
      </div>
    );
  }

  const displayNameOrName = displayName || fullName;
  const initials = displayNameOrName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b sticky top-0 bg-background z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <button onClick={() => navigate("/dashboard")} className="icon-btn">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Edit Profile</h1>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="h-32 w-32">
              <AvatarImage src={avatarUrl} className="object-cover" />
              <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
            </Avatar>
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 p-2 bg-foreground text-background rounded-full cursor-pointer hover:opacity-90 transition-opacity"
            >
              <Camera size={16} />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </label>
            {avatarUrl && (
              <button
                onClick={handleDeleteAvatar}
                className="absolute top-0 left-0 p-2 bg-destructive text-destructive-foreground rounded-full cursor-pointer hover:opacity-90 transition-opacity"
                disabled={saving}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Basic Information</h2>
          
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Smith"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How you'd like to be called"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input
              id="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Product Designer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Enter company name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortBio">Bio</Label>
            <Textarea
              id="shortBio"
              value={shortBio}
              onChange={(e) => setShortBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={3}
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">Contact Information</h2>
            <div className="flex items-center gap-2">
              <Label htmlFor="showContact" className="text-sm">Show</Label>
              <Switch
                id="showContact"
                checked={showContactInfo}
                onCheckedChange={setShowContactInfo}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Country"
            />
          </div>
        </div>

        {/* Likes */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Likes</h2>
          <p className="text-sm text-muted-foreground">Add things you enjoy - hobbies, food, music, activities, etc.</p>
          
          <div className="flex gap-2">
            <Input
              value={newLike}
              onChange={(e) => setNewLike(e.target.value)}
              placeholder="e.g., Coffee, Hiking, Jazz..."
              onKeyPress={(e) => e.key === 'Enter' && addLike()}
            />
            <Button onClick={addLike} size="icon" disabled={!newLike.trim()}>
              <Plus size={18} />
            </Button>
          </div>

          {likes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {likes.map((tag) => (
                <span key={tag.id} className="tag-pill">
                  {tag.name}
                  <button
                    onClick={() => removeLike(tag.id)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Dislikes */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Dislikes</h2>
          <p className="text-sm text-muted-foreground">Add things you're not a fan of</p>
          
          <div className="flex gap-2">
            <Input
              value={newDislike}
              onChange={(e) => setNewDislike(e.target.value)}
              placeholder="e.g., Spicy food, Crowds..."
              onKeyPress={(e) => e.key === 'Enter' && addDislike()}
            />
            <Button onClick={addDislike} size="icon" disabled={!newDislike.trim()}>
              <Plus size={18} />
            </Button>
          </div>

          {dislikes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {dislikes.map((tag) => (
                <span key={tag.id} className="tag-pill bg-foreground/5">
                  {tag.name}
                  <button
                    onClick={() => removeDislike(tag.id)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Profile Visibility */}
        <div className="space-y-4 pb-8">
          <h2 className="font-bold text-lg">Profile Visibility</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Public Profile</p>
                <p className="text-sm text-muted-foreground">Anyone can view your profile</p>
              </div>
              <Switch checked disabled />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Show Contact Info</p>
                <p className="text-sm text-muted-foreground">Display email and phone</p>
              </div>
              <Switch
                checked={showContactInfo}
                onCheckedChange={setShowContactInfo}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Show Social Links</p>
                <p className="text-sm text-muted-foreground">Display social media profiles</p>
              </div>
              <Switch
                checked={showSocialLinks}
                onCheckedChange={setShowSocialLinks}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
