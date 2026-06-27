"use client";

import { useState } from "react";
import { CreateWebsiteFormSchema } from "@/features/websites/schemas/website-schema";
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
import { Plus } from "lucide-react";

interface CreateWebsiteDialogProps {
  /** Called with (name, domain) when the form is submitted. */
  onCreate: (name: string, domain: string) => Promise<unknown>;
}

/**
 * Dialog for adding a new website to the organization.
 *
 * Validates fields client-side via Zod, shows loading state while submitting,
 * and displays field-level errors.
 */
export function CreateWebsiteDialog({ onCreate }: CreateWebsiteDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    setGeneralError(null);

    // Validate
    const result = CreateWebsiteFormSchema.safeParse({ name, domain });
    if (!result.success) {
      setFieldError(result.error.errors[0]?.message ?? "Invalid input");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate(result.data.name, result.data.domain);
      setName("");
      setDomain("");
      setOpen(false);
    } catch (err) {
      setGeneralError(
        err instanceof Error ? err.message : "Failed to create website",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName("");
      setDomain("");
      setFieldError(null);
      setGeneralError(null);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Add Website
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Website</DialogTitle>
          <DialogDescription>
            Enter the website details. The domain will be normalized
            automatically (e.g., https://www.example.com → example.com).
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
              <Label htmlFor="create-name">Website Name</Label>
              <Input
                id="create-name"
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
              <Label htmlFor="create-domain">Domain</Label>
              <Input
                id="create-domain"
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding…" : "Add Website"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
