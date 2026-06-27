"use client";

import { useState } from "react";
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
import { Trash2 } from "lucide-react";

interface DeleteOrganizationDialogProps {
  organization: OrganizationDTO;
  onDelete: (id: string) => Promise<unknown>;
}

/**
 * Delete confirmation dialog.
 *
 * Requires the user to type the organization name to confirm.
 * Prevents accidental deletions.
 * Only available for OWNER roles (enforced server-side).
 */
export function DeleteOrganizationDialog({
  organization,
  onDelete,
}: DeleteOrganizationDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = confirmText === organization.name;

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onDelete(organization.id);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete organization");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmText("");
      setError(null);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete {organization.name}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Organization</DialogTitle>
          <DialogDescription>
            This action cannot be undone. All associated data, websites, and scans
            will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <p className="text-sm">
            Type <strong>{organization.name}</strong> to confirm deletion:
          </p>
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={organization.name}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={isSubmitting}
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
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
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || isSubmitting}
          >
            {isSubmitting ? "Deleting…" : "Delete Organization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
