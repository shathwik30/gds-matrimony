"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, User, Bell, Lock, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { getMyProfile, updateProfile, getNotificationPrefs, saveNotificationPrefs } from "@/lib/actions/profile";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Profile settings
  const [hideProfile, setHideProfile] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showLastActive, setShowLastActive] = useState(true);

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [interestNotifications, setInterestNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [matchNotifications, setMatchNotifications] = useState(true);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Delete account
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [profileResult, notifResult] = await Promise.all([
        getMyProfile(),
        getNotificationPrefs(),
      ]);
      if (profileResult.success && profileResult.data) {
        setHideProfile(profileResult.data.hideProfile || false);
        setShowOnlineStatus(profileResult.data.showOnlineStatus ?? true);
        setShowLastActive(profileResult.data.showLastActive ?? true);
      }
      if (notifResult.success && notifResult.data) {
        setEmailNotifications(notifResult.data.email);
        setInterestNotifications(notifResult.data.interests);
        setMessageNotifications(notifResult.data.messages);
        setMatchNotifications(notifResult.data.matches);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePrivacySettings = async () => {
    setIsSavingPrivacy(true);
    try {
      const result = await updateProfile({
        hideProfile,
        showOnlineStatus,
        showLastActive,
      } as Record<string, unknown>);

      if (result.success) {
        toast.success("Privacy settings saved");
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    setIsSavingNotifications(true);
    try {
      const result = await saveNotificationPrefs({
        email: emailNotifications,
        interests: interestNotifications,
        messages: messageNotifications,
        matches: matchNotifications,
      });

      if (result.success) {
        toast.success("Notification settings saved");
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error("Please fill all password fields");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (newPassword.length > 128) {
      toast.error("Password must be less than 128 characters");
      return;
    }

    if (!/^(?=.*[a-zA-Z])(?=.*[0-9])/.test(newPassword)) {
      toast.error("Password must contain both letters and numbers");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || "Failed to change password");
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        toast.error(data.error || "Failed to change password");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Please enter your password to confirm account deletion");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/user/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || "Failed to delete account");
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success("Account deactivated successfully");
        await signOut({ redirectTo: "/" });
      } else {
        toast.error(data.error || "Failed to delete account");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsDeleting(false);
      setDeletePassword("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8 md:mb-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-1 sm:mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="privacy" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1">
          <TabsTrigger value="privacy">
            <Eye className="h-4 w-4 mr-2 hidden sm:inline" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2 hidden sm:inline" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-2 hidden sm:inline" />
            Security
          </TabsTrigger>
          <TabsTrigger value="account">
            <User className="h-4 w-4 mr-2 hidden sm:inline" />
            Account
          </TabsTrigger>
        </TabsList>

        {/* Privacy Settings */}
        <TabsContent value="privacy">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control who can see your profile and information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label>Hide Profile</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Temporarily hide your profile from search results
                  </p>
                </div>
                <Switch
                  checked={hideProfile}
                  onCheckedChange={setHideProfile}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label>Show Online Status</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Let others see when you are currently online
                  </p>
                </div>
                <Switch
                  checked={showOnlineStatus}
                  onCheckedChange={setShowOnlineStatus}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label>Show Last Active</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Let others see when you were last active on the platform
                  </p>
                </div>
                <Switch checked={showLastActive} onCheckedChange={setShowLastActive} />
              </div>

              <Button onClick={handleSavePrivacySettings} disabled={isSavingPrivacy}>
                {isSavingPrivacy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Privacy Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Receive important updates via email
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label>Interest Notifications</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Get notified when someone sends you an interest
                  </p>
                </div>
                <Switch
                  checked={interestNotifications}
                  onCheckedChange={setInterestNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label>Message Notifications</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Get notified when you receive new messages
                  </p>
                </div>
                <Switch
                  checked={messageNotifications}
                  onCheckedChange={setMessageNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label>New Match Notifications</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Get notified about new matching profiles
                  </p>
                </div>
                <Switch
                  checked={matchNotifications}
                  onCheckedChange={setMatchNotifications}
                />
              </div>

              <Button onClick={handleSaveNotificationSettings} disabled={isSavingNotifications}>
                {isSavingNotifications && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <PasswordInput
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <PasswordInput
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                {isChangingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Change Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 border border-destructive/20 rounded-lg">
                <div className="space-y-0.5">
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently deactivate
                        your account and hide all your data. Enter your password to confirm.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                      <Label htmlFor="deletePassword">Confirm Password</Label>
                      <Input
                        id="deletePassword"
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Enter your password"
                        className="mt-2"
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeletePassword("")}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={!deletePassword || isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Yes, delete my account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
