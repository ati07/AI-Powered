"use client";

import { useState } from "react";
import { EditWebsiteFormSchema } from "@/features/websites/schemas/website-schema";
import type { WebsiteDTO } from "@/features/websites/schemas/website-schema";
import { Button } from "@/components/ui/button";
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
import { Pencil } from "lucide-react";

interface EditWebsiteDialogProps {
  website: WebsiteDTO;
  onUpdate: (id: string, data: { name?: string; domain?: string }) => Promise<unknown>;
}

/**
 * Dialog for editing a website's name and/or domain.
 *
 * Pre-fills the current values and validates client-side.
 */
export function EditWebsiteDialog({
  website,
  onUpdate,
}: EditWebsiteDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(website.name);
  const [domain, setDomain] = useState(website.domain);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    setGeneralError(null);

    const result = EditWebsiteFormSchema.safeParse({ name, domain });
    if (!result.success) {
      setFieldError(result.error.errors[0]?.message ?? "Invalid input");
      return;
    }

    // Build update payload — only send changed fields
    const data: { name?: string; domain?: string } = {};
    if (result.data.name !== website.name) data.name = result.data.name;
    if (result.data.domain !== website.domain && result.data.domain !== website.normalizedDomain) {
      data.domain = result.data.domain;
    }

    // No changes
    if (Object.keys(data).length === 0) {
      setOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate(website.id, data);
      setOpen(false);
    } catch (err) {
      setGeneralError(
        err instanceof Error ? err.message : "Failed to update website",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setName(website.name);
      setDomain(website.domain);
      setFieldError(null);
      setGeneralError(null);
    }
    setOpen(newOpen);
  };

  const hasChanges = name !== website.name || domain !== website.domain;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit {website.name}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Website</DialogTitle>
          <DialogDescription>
            Update the website name and/or domain. The normalized domain will
            be recalculated if changed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* General error */}
            {generalError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {generalError}
              </div>
            )}

            {/* Name field */}
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Website Name</Label>
              <Input
                id="edit-name"
                placeholder="My Website"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
              {fieldError && !domain && (
                <p className="text-sm text-destructive">{fieldError}</p>
              )}
            </div>

            {/* Domain field */}
            <div className="grid gap-2">
              <Label htmlFor="edit-domain">Domain</Label>
              <Input
                id="edit-domain"
                placeholder="https://example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !hasChanges}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
