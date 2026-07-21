import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Acquira" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const fetchProfile = useServerFn(getMyProfile);
  const save = useServerFn(updateMyProfile);
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => fetchProfile(),
  });
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState("");
  const [lang, setLang] = useState("it");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.display_name ?? "");
      setLang(profile.target_language ?? "it");
    }
  }, [profile]);

  const onSave = async () => {
    setSaving(true);
    try {
      await save({ data: { display_name: name, target_language: lang } });
      await qc.invalidateQueries({ queryKey: ["profile", "me"] });
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your account and learning preferences.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Profile</CardTitle>
            <CardDescription>How you appear inside Acquira.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Display name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="lang">Target language</Label>
              <Select value={lang} onValueChange={setLang}>
                <SelectTrigger id="lang">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="it">Italian (available)</SelectItem>
                  <SelectItem value="fr" disabled>French — coming soon</SelectItem>
                  <SelectItem value="es" disabled>Spanish — coming soon</SelectItem>
                  <SelectItem value="de" disabled>German — coming soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={onSave} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Appearance</CardTitle>
            <CardDescription>Choose how Acquira looks on this device.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={theme}
              onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}
              className="grid gap-2 sm:grid-cols-3"
            >
              {(["light", "dark", "system"] as const).map((t) => (
                <label
                  key={t}
                  htmlFor={`theme-${t}`}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent"
                >
                  <RadioGroupItem id={`theme-${t}`} value={t} />
                  <span className="text-sm capitalize">{t}</span>
                </label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Account</CardTitle>
            <CardDescription>Signed in with a secure session.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Account since{" "}
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
