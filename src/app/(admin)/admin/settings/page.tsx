"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Settings, Mail, Bell, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSiteSettings, updateSiteSettings } from "@/lib/actions/admin";

const DEFAULT_SETTINGS: Record<string, string> = {
  siteName: "GDS Marriage Links",
  siteUrl: "https://gdsmarriagelinks.com",
  supportEmail: "support@gdsmarriagelinks.com",
  supportPhone: "+91 98765 43210",
  address: "Mumbai, Maharashtra, India",
  workingHours: "Mon - Sat: 9:00 AM - 6:00 PM",
  maintenanceMode: "false",
  registrationEnabled: "true",
  maxPhotos: "5",
  termsUpdatedAt: "January 2025",
  privacyUpdatedAt: "January 2025",
  fromEmail: "noreply@gdsmarriagelinks.com",
  fromName: "GDS Marriage Links",
  welcomeEmail: "true",
  interestNotifications: "true",
  messageNotifications: "true",
  subscriptionReminders: "true",
  notificationEmail: "admin@gdsmarriagelinks.com",
  adminNewRegistration: "false",
  adminNewReport: "true",
  adminNewPayment: "true",
  adminVerificationRequest: "true",
  twoFactorAuth: "false",
  emailVerificationRequired: "true",
  profileModeration: "false",
  sessionTimeout: "60",
  maxLoginAttempts: "5",
};

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await getSiteSettings();
      if (result.success && result.data) {
        setSettings((prev) => ({ ...prev, ...result.data }));
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSwitch = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: prev[key] === "true" ? "false" : "true",
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateSiteSettings(settings);
      if (result.success) {
        toast.success("Settings saved successfully");
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="text-brand h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Settings</h1>
        <p className="text-slate-500">Configure platform settings and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="border bg-white">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure general platform settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => updateField("siteName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input
                    id="siteUrl"
                    value={settings.siteUrl}
                    onChange={(e) => updateField("siteUrl", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    value={settings.supportEmail}
                    onChange={(e) => updateField("supportEmail", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Support Phone</Label>
                  <Input
                    id="supportPhone"
                    value={settings.supportPhone}
                    onChange={(e) => updateField("supportPhone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Office Address</Label>
                  <Input
                    id="address"
                    value={settings.address}
                    onChange={(e) => updateField("address", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workingHours">Working Hours</Label>
                  <Input
                    id="workingHours"
                    value={settings.workingHours}
                    onChange={(e) => updateField("workingHours", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPhotos">Max Profile Photos</Label>
                  <Input
                    id="maxPhotos"
                    type="number"
                    value={settings.maxPhotos}
                    onChange={(e) => updateField("maxPhotos", e.target.value)}
                  />
                  <p className="text-xs text-slate-500">
                    Maximum number of photos users can upload to their profile
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="termsUpdatedAt">Terms Last Updated</Label>
                  <Input
                    id="termsUpdatedAt"
                    value={settings.termsUpdatedAt}
                    onChange={(e) => updateField("termsUpdatedAt", e.target.value)}
                    placeholder="e.g. February 2026"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="privacyUpdatedAt">Privacy Policy Last Updated</Label>
                  <Input
                    id="privacyUpdatedAt"
                    value={settings.privacyUpdatedAt}
                    onChange={(e) => updateField("privacyUpdatedAt", e.target.value)}
                    placeholder="e.g. February 2026"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                <div>
                  <p className="font-medium text-slate-900">Maintenance Mode</p>
                  <p className="text-sm text-slate-500">
                    Disable public access to the site for maintenance
                  </p>
                </div>
                <Switch
                  checked={settings.maintenanceMode === "true"}
                  onCheckedChange={() => toggleSwitch("maintenanceMode")}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                <div>
                  <p className="font-medium text-slate-900">New Registrations</p>
                  <p className="text-sm text-slate-500">
                    Allow new users to register on the platform
                  </p>
                </div>
                <Switch
                  checked={settings.registrationEnabled === "true"}
                  onCheckedChange={() => toggleSwitch("registrationEnabled")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>Configure email templates and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    value={settings.fromEmail}
                    onChange={(e) => updateField("fromEmail", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={settings.fromName}
                    onChange={(e) => updateField("fromName", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-slate-900">Email Notifications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <span className="text-sm text-slate-600">Welcome Email</span>
                    <Switch
                      checked={settings.welcomeEmail === "true"}
                      onCheckedChange={() => toggleSwitch("welcomeEmail")}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <span className="text-sm text-slate-600">Interest Notifications</span>
                    <Switch
                      checked={settings.interestNotifications === "true"}
                      onCheckedChange={() => toggleSwitch("interestNotifications")}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <span className="text-sm text-slate-600">Message Notifications</span>
                    <Switch
                      checked={settings.messageNotifications === "true"}
                      onCheckedChange={() => toggleSwitch("messageNotifications")}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <span className="text-sm text-slate-600">Subscription Reminders</span>
                    <Switch
                      checked={settings.subscriptionReminders === "true"}
                      onCheckedChange={() => toggleSwitch("subscriptionReminders")}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure admin notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-slate-900">Admin Alerts</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">New User Registration</p>
                      <p className="text-xs text-slate-500">
                        Get notified when a new user registers
                      </p>
                    </div>
                    <Switch
                      checked={settings.adminNewRegistration === "true"}
                      onCheckedChange={() => toggleSwitch("adminNewRegistration")}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">New Report</p>
                      <p className="text-xs text-slate-500">Get notified when a user is reported</p>
                    </div>
                    <Switch
                      checked={settings.adminNewReport === "true"}
                      onCheckedChange={() => toggleSwitch("adminNewReport")}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">New Payment</p>
                      <p className="text-xs text-slate-500">
                        Get notified on new subscription payments
                      </p>
                    </div>
                    <Switch
                      checked={settings.adminNewPayment === "true"}
                      onCheckedChange={() => toggleSwitch("adminNewPayment")}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Verification Request</p>
                      <p className="text-xs text-slate-500">
                        Get notified on new verification requests
                      </p>
                    </div>
                    <Switch
                      checked={settings.adminVerificationRequest === "true"}
                      onCheckedChange={() => toggleSwitch("adminVerificationRequest")}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notificationEmail">Notification Email</Label>
                <Input
                  id="notificationEmail"
                  value={settings.notificationEmail}
                  onChange={(e) => updateField("notificationEmail", e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Email address where admin notifications will be sent
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security and authentication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                  <div>
                    <p className="font-medium text-slate-900">Two-Factor Authentication</p>
                    <p className="text-sm text-slate-500">Require 2FA for admin accounts</p>
                  </div>
                  <Switch
                    checked={settings.twoFactorAuth === "true"}
                    onCheckedChange={() => toggleSwitch("twoFactorAuth")}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                  <div>
                    <p className="font-medium text-slate-900">Email Verification Required</p>
                    <p className="text-sm text-slate-500">
                      Require email verification for new accounts
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailVerificationRequired === "true"}
                    onCheckedChange={() => toggleSwitch("emailVerificationRequired")}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                  <div>
                    <p className="font-medium text-slate-900">Profile Moderation</p>
                    <p className="text-sm text-slate-500">
                      Require admin approval for new profiles
                    </p>
                  </div>
                  <Switch
                    checked={settings.profileModeration === "true"}
                    onCheckedChange={() => toggleSwitch("profileModeration")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => updateField("sessionTimeout", e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Automatically log out users after inactivity
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => updateField("maxLoginAttempts", e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Lock account after this many failed login attempts
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </div>
    </div>
  );
}
