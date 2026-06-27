"use client";

import { useState } from "react";
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
import { Trash2 } from "lucide-react";

interface DeleteWebsiteDialogProps {
  website: WebsiteDTO;
  onDelete: (id: string) => Promise<void>;
}

/**
 * Dialog for deleting a website with confirmation.
 *
 * Requires the user to type the website name to enable the delete button,
 * preventing accidental deletions.
 */
export function DeleteWebsiteDialog({
  website,
  onDelete,
}: DeleteWebsiteDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (confirmText !== website.name) return;

    setIsSubmitting(true);
    try {
      await onDelete(website.id);
      setConfirmText("");
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete website",
      );
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

  const isConfirmed = confirmText === website.name;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4 text-destructive" />
          <span className="sr-only">Delete {website.name}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Website</DialogTitle>
          <DialogDescription>
            This will permanently delete <strong>{website.name}</strong> and
            all associated scan data. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="delete-confirm">
                Type <strong>{website.name}</strong> to confirm:
              </Label>
              <Input
                id="delete-confirm"
                placeholder={website.name}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={isSubmitting}
                autoFocus
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
            <Button
              type="submit"
              variant="destructive"
              disabled={!isConfirmed || isSubmitting}
            >
              {isSubmitting ? "Deleting…" : "Delete Website"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
