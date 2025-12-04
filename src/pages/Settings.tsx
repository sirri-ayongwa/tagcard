import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Trash2, LogOut, Download, HelpCircle, Coffee, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Settings = () => {
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpSubject, setHelpSubject] = useState("");
  const [helpMessage, setHelpMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteOptionsDialog, setShowDeleteOptionsDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
    setShowSignOutDialog(false);
  };

  const exportData = async () => {
    if (!user) return;

    setIsExporting(true);
    try {
      // Fetch all user data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: tags } = await supabase
        .from('tags')
        .select('*')
        .eq('profile_id', user.id);

      const { data: socialLinks } = await supabase
        .from('social_links')
        .select('*')
        .eq('profile_id', user.id);

      // Create PDF
      const pdf = new jsPDF();
      let yPosition = 20;

      // Title
      pdf.setFontSize(20);
      pdf.text("TagCard Profile Data Export", 20, yPosition);
      yPosition += 15;

      // Profile Information
      pdf.setFontSize(14);
      pdf.text("Profile Information", 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      if (profile) {
        const profileData = [
          `Name: ${profile.full_name || 'N/A'}`,
          `Display Name: ${profile.display_name || 'N/A'}`,
          `Email: ${profile.email || 'N/A'}`,
          `Phone: ${profile.phone || 'N/A'}`,
          `Job Title: ${profile.job_title || 'N/A'}`,
          `Company: ${profile.company || 'N/A'}`,
          `Location: ${profile.location || 'N/A'}`,
          `Website: ${profile.website || 'N/A'}`,
          `Bio: ${profile.short_bio || 'N/A'}`,
          `Profile Views: ${profile.profile_views || 0}`,
        ];

        profileData.forEach((line) => {
          pdf.text(line, 20, yPosition);
          yPosition += 7;
        });
      }

      yPosition += 10;

      // Tags
      if (tags && tags.length > 0) {
        pdf.setFontSize(14);
        pdf.text("Tags", 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        const likes = tags.filter(t => t.tag_type === 'like');
        const dislikes = tags.filter(t => t.tag_type === 'dislike');

        if (likes.length > 0) {
          pdf.text("Likes:", 20, yPosition);
          yPosition += 7;
          likes.forEach((tag) => {
            pdf.text(`- ${tag.name}`, 25, yPosition);
            yPosition += 6;
          });
        }

        if (dislikes.length > 0) {
          yPosition += 5;
          pdf.text("Dislikes:", 20, yPosition);
          yPosition += 7;
          dislikes.forEach((tag) => {
            pdf.text(`- ${tag.name}`, 25, yPosition);
            yPosition += 6;
          });
        }
      }

      yPosition += 10;

      // Social Links
      if (socialLinks && socialLinks.length > 0) {
        pdf.setFontSize(14);
        pdf.text("Social Links", 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        socialLinks.forEach((link) => {
          pdf.text(`${link.platform}: ${link.url}`, 20, yPosition);
          yPosition += 7;
        });
      }

      // Download PDF
      pdf.save(`TagCard_Data_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Data exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      // Delete user's tags
      await supabase.from('tags').delete().eq('profile_id', user.id);

      // Delete user's social links
      await supabase.from('social_links').delete().eq('profile_id', user.id);

      // Delete user's QR codes
      await supabase.from('qr_codes').delete().eq('profile_id', user.id);

      // Delete user's profile views
      await supabase.from('profile_views').delete().eq('profile_id', user.id);

      // Delete user's profile
      await supabase.from('profiles').delete().eq('id', user.id);

      // Delete user's avatar from storage if exists
      await supabase.storage.from('avatars').remove([`${user.id}/`]);

      // Sign out the user
      await signOut();
      
      toast.success("Account deleted successfully");
      navigate("/");
    } catch (error: any) {
      console.error("Delete account error:", error);
      toast.error("Failed to delete account. Some data may remain. Please contact support.");
    } finally {
      setShowDeleteDialog(false);
      setShowDeleteOptionsDialog(false);
    }
  };

  const handleSendHelp = async () => {
    if (!helpSubject.trim() || !helpMessage.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-help-request', {
        body: {
          userEmail: user?.email,
          subject: helpSubject,
          message: helpMessage,
        },
      });

      if (error) throw error;

      toast.success("Help request sent! We'll get back to you soon.");
      setHelpOpen(false);
      setHelpSubject("");
      setHelpMessage("");
    } catch (error: any) {
      toast.error("Failed to send help request");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate("/dashboard")} className="icon-btn">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Account Section */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Account</h2>
          
          <div className="space-y-2">
            <div className="p-4 border rounded-xl">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* General Settings */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg">General</h2>
          
          <button
            onClick={() => navigate("/edit-profile")}
            className="w-full p-4 border rounded-xl text-left hover:bg-muted transition-colors"
          >
            <p className="font-medium">Edit Profile</p>
            <p className="text-sm text-muted-foreground">Update your profile information</p>
          </button>

          <button
            onClick={toggleTheme}
            className="w-full p-4 border rounded-xl text-left hover:bg-muted transition-colors flex items-center justify-between"
          >
            <div>
              <p className="font-medium">Appearance</p>
              <p className="text-sm text-muted-foreground">
                {theme === "light" ? "Light mode" : "Dark mode"}
              </p>
            </div>
            {theme === "light" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-auto p-4"
            onClick={exportData}
            disabled={isExporting}
          >
            <Download size={18} />
            <div className="text-left">
              <p className="font-medium">{isExporting ? "Exporting..." : "Export Data"}</p>
              <p className="text-sm text-muted-foreground">Download your profile data</p>
            </div>
          </Button>
        </div>

        {/* Privacy & Security */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Privacy & Security</h2>
          
          <div className="p-4 border rounded-xl">
            <p className="font-medium">Privacy Settings</p>
            <p className="text-sm text-muted-foreground">Configure in Edit Profile</p>
          </div>
        </div>

        {/* Support */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Support</h2>
          
          <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
            <DialogTrigger asChild>
              <button className="w-full p-4 border rounded-xl text-left hover:bg-muted transition-colors flex items-center justify-between">
                <div>
                  <p className="font-medium">Help Center</p>
                  <p className="text-sm text-muted-foreground">Get help and support</p>
                </div>
                <HelpCircle size={20} />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Contact Support</DialogTitle>
                <DialogDescription>
                  Send us a message and we'll get back to you as soon as possible.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={helpSubject}
                    onChange={(e) => setHelpSubject(e.target.value)}
                    placeholder="What do you need help with?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={helpMessage}
                    onChange={(e) => setHelpMessage(e.target.value)}
                    placeholder="Describe your issue or question..."
                    rows={5}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setHelpOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendHelp} disabled={sending} className="btn-primary">
                  {sending ? "Sending..." : "Send"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <a
            href="https://tagcard.canny.io/feature-requests"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full p-4 border rounded-xl text-left hover:bg-muted transition-colors flex items-center justify-between block"
          >
            <div>
              <p className="font-medium">Improve TagCard</p>
              <p className="text-sm text-muted-foreground">Request features & vote on ideas</p>
            </div>
            <ExternalLink size={20} />
          </a>

          <a
            href="https://ko-fi.com/sirri"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full p-4 border rounded-xl text-left hover:bg-muted transition-colors flex items-center justify-between block"
          >
            <div>
              <p className="font-medium">Support App Developer</p>
              <p className="text-sm text-muted-foreground">Love TagCard? Buy me a coffee ☕</p>
            </div>
            <Coffee size={20} />
          </a>

          <button onClick={() => navigate("/about")} className="w-full p-4 border rounded-xl text-left hover:bg-muted transition-colors">
            <p className="font-medium">About TagCard</p>
            <p className="text-sm text-muted-foreground">Version 1.0</p>
          </button>
        </div>

        {/* Danger Zone */}
        <div className="space-y-4 pb-8">
          <h2 className="font-bold text-lg text-destructive">Danger Zone</h2>
          
          <Button
            onClick={() => setShowSignOutDialog(true)}
            variant="outline"
            className="w-full justify-start h-auto p-4 border-foreground hover:bg-foreground hover:text-background"
          >
            <div className="flex items-center gap-3">
              <LogOut size={20} />
              <div className="text-left">
                <p className="font-medium">Sign Out</p>
                <p className="text-sm opacity-70">Sign out of your account</p>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto p-4 border-destructive text-destructive hover:bg-destructive hover:text-background"
            onClick={() => setShowDeleteOptionsDialog(true)}
          >
            <div className="flex items-center gap-3">
              <Trash2 size={20} />
              <div className="text-left">
                <p className="font-medium">Delete Account</p>
                <p className="text-sm opacity-70">Permanently delete your account</p>
              </div>
            </div>
          </Button>
        </div>
      </div>

      {/* Sign Out Dialog */}
      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut}>Sign Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Options Dialog */}
      <AlertDialog open={showDeleteOptionsDialog} onOpenChange={setShowDeleteOptionsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Before you go...</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to export your data before deleting your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={async () => {
                await exportData();
                setShowDeleteOptionsDialog(false);
              }}
              disabled={isExporting}
            >
              <Download size={16} className="mr-2" />
              Export Data
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowDeleteOptionsDialog(false);
                setShowDeleteDialog(true);
              }}
            >
              <Trash2 size={16} className="mr-2" />
              Delete Account
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you absolutely sure? This action cannot be undone. This will permanently
              delete your account and remove all your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
