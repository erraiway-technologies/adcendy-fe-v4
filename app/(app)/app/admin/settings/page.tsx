'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AlertCircle, ChevronLeft, Search } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { SystemSettingRow } from '@/shared/components/ops/SystemSettingRow';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function AdminSystemSettingsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const settingsQuery = useSystemSettings(isAdmin);
  const [search, setSearch] = useState('');
  const [changedOnly, setChangedOnly] = useState(false);

  const groups = useMemo(() => {
    const listing = settingsQuery.data;
    if (!listing) {
      return [];
    }
    const term = search.trim().toLowerCase();
    const matches = listing.settings.filter(
      (setting) =>
        (!changedOnly || !setting.isDefault) &&
        (!term ||
          [setting.label, setting.key, setting.effect].some((field) => field.toLowerCase().includes(term))),
    );
    return listing.categories
      .map((category) => ({
        category,
        settings: matches.filter((setting) => setting.category === category.id),
      }))
      .filter((group) => group.settings.length > 0);
  }, [settingsQuery.data, search, changedOnly]);

  if (isAuthLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading settings...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div className="space-y-1">
              <p className="text-lg font-semibold">Permission denied</p>
              <p className="text-sm text-muted-foreground">System settings are only available to administrators.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const total = settingsQuery.data?.settings.length ?? 0;
  const changedCount = settingsQuery.data?.settings.filter((setting) => !setting.isDefault).length ?? 0;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="space-y-3">
        <Link href="/app/admin">
          <Button variant="ghost" className="-ml-3 w-fit">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Admin Ops
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="font-space-grotesk text-3xl font-bold text-foreground">System settings</h1>
          <p className="max-w-3xl text-muted-foreground">
            How the strategy pipeline and the platform behave. Each setting says what changes when you change it.
            Every change needs a reason and is kept in its history, where it can be undone. Pipeline settings apply
            to runs that start after the change; a run already in progress keeps the values it started with.
          </p>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="grid gap-4 p-4 sm:p-5 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="settings-search">Find a setting</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="settings-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, key or effect"
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 md:pb-2">
            <Switch id="settings-changed-only" checked={changedOnly} onCheckedChange={setChangedOnly} />
            <Label htmlFor="settings-changed-only">
              Only changed from default{settingsQuery.data ? ` (${changedCount} of ${total})` : ''}
            </Label>
          </div>
        </CardContent>
      </Card>

      {settingsQuery.isLoading ? (
        <Card className="border-border bg-card">
          <CardContent className="p-5 text-sm text-muted-foreground">Loading settings...</CardContent>
        </Card>
      ) : settingsQuery.error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-5 text-sm text-destructive">
            {settingsQuery.error instanceof Error ? settingsQuery.error.message : 'Failed to load settings.'}
          </CardContent>
        </Card>
      ) : groups.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="p-5 text-sm text-muted-foreground">No setting matches.</CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {groups.map(({ category, settings }) => (
            <section key={category.id} className="space-y-3">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-foreground">{category.label}</h2>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
              <Card className="border-border bg-card">
                <CardContent className="p-0">
                  {settings.map((setting) => (
                    <SystemSettingRow key={setting.key} setting={setting} />
                  ))}
                </CardContent>
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
