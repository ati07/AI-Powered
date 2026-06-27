"use client";

import { useState } from "react";
import { EditOrganizationFormSchema } from "@/features/organizations/schemas/organization-schema";
import type { OrganizationDTO } from "@/features/organizations/schemas/organization-schema";
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

interface EditOrganizationDialogProps {
  organization: OrganizationDTO;
  onRename: (id: string, name: string) => Promise<unknown>;
}

/**
 * Dialog for renaming an organization.
 *
 * Pre-fills the current name and validates client-side.
 * Slug remains unchanged after creation.
 */
export function EditOrganizationDialog({
  organization,
  onRename,
}: EditOrganizationDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(organization.name);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    const result = EditOrganizationFormSchema.safeParse({ name });
    if (!result.success) {
      setFieldError(result.error.errors[0]?.message ?? "Invalid name");
      return;
    }

    // No change
    if (result.data.name === organization.name) {
      setOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await onRename(organization.id, result.data.name);
      setOpen(false);
    } catch {
      // Error surfaced by parent hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setName(organization.name);
      setFieldError(null);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit {organization.name}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Organization</DialogTitle>
          <DialogDescription>
            Rename your organization. The URL slug will not change.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Organization Name</Label>
              <Input
                id="edit-name"
                placeholder="e.g. Acme Marketing"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
              {fieldError && (
                <p className="text-sm text-destructive">{fieldError}</p>
              )}
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
            <Button type="submit" disabled={isSubmitting || name === organization.name}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
