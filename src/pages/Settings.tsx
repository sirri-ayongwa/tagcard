import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const handleDeleteAccount = async () => {
    toast.error("Account deletion is not yet implemented");
  };

  const handleExportData = () => {
    toast.info("Data export coming soon!");
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
            onClick={handleExportData}
            className="w-full p-4 border rounded-xl text-left hover:bg-muted transition-colors flex items-center justify-between"
          >
            <div>
              <p className="font-medium">Export Data</p>
              <p className="text-sm text-muted-foreground">Download your profile data</p>
            </div>
            <Download size={20} />
          </button>
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
          
          <button className="w-full p-4 border rounded-xl text-left hover:bg-muted transition-colors">
            <p className="font-medium">Help Center</p>
            <p className="text-sm text-muted-foreground">Get help and support</p>
          </button>

          <button className="w-full p-4 border rounded-xl text-left hover:bg-muted transition-colors">
            <p className="font-medium">About TagCard</p>
            <p className="text-sm text-muted-foreground">Version 1.0.0</p>
          </button>
        </div>

        {/* Danger Zone */}
        <div className="space-y-4 pb-8">
          <h2 className="font-bold text-lg text-destructive">Danger Zone</h2>
          
          <Button
            onClick={handleSignOut}
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

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4 border-destructive text-destructive hover:bg-destructive hover:text-background"
              >
                <div className="flex items-center gap-3">
                  <Trash2 size={20} />
                  <div className="text-left">
                    <p className="font-medium">Delete Account</p>
                    <p className="text-sm opacity-70">Permanently delete your account</p>
                  </div>
                </div>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove
                  all your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive">
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default Settings;
