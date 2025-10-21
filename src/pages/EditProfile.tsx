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
import { ArrowLeft, Camera, X, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

const EditProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
  const [tags, setTags] = useState<Array<{ id: string; name: string }>>([]);
  const [newTag, setNewTag] = useState("");

  // Social links
  const [socialLinks, setSocialLinks] = useState<Array<{ id: string; platform: string; url: string }>>([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadProfile();
  }, [user]);

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
      
      setTags(tagsData || []);

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

  const addTag = async () => {
    if (!newTag.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({ profile_id: user.id, name: newTag.trim() })
        .select()
        .single();

      if (error) throw error;
      setTags([...tags, data]);
      setNewTag("");
      toast.success("Tag added!");
    } catch (error) {
      toast.error("Failed to add tag");
    }
  };

  const removeTag = async (tagId: string) => {
    try {
      await supabase.from('tags').delete().eq('id', tagId);
      setTags(tags.filter(t => t.id !== tagId));
      toast.success("Tag removed!");
    } catch (error) {
      toast.error("Failed to remove tag");
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

  if (loading) {
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
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
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

        {/* Tags */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Likes & Dislikes</h2>
          
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a skill or tag"
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
            />
            <Button onClick={addTag} size="icon" disabled={!newTag.trim()}>
              <Plus size={18} />
            </Button>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag.id} className="tag-pill">
                  {tag.name}
                  <button
                    onClick={() => removeTag(tag.id)}
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
