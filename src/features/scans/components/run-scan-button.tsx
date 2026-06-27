"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";

interface RunScanButtonProps {
  /** Whether a scan is currently running. */
  isRunning: boolean;
  /** Called when the user clicks the button to start a scan. */
  onStartScan: () => Promise<unknown>;
  /** Whether the user has permission to start scans. */
  canManage: boolean;
}

/**
 * Button to start a new scan.
 *
 * Disables while a scan is running or while the request is in flight.
 */
export function RunScanButton({
  isRunning,
  onStartScan,
  canManage,
}: RunScanButtonProps) {
  const [isStarting, setIsStarting] = useState(false);

  if (!canManage) return null;

  const handleClick = async () => {
    setIsStarting(true);
    try {
      await onStartScan();
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isRunning || isStarting}
      size="sm"
    >
      {isStarting ? (
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
      ) : (
        <Play className="mr-1 h-4 w-4" />
      )}
      {isStarting ? "Starting…" : isRunning ? "Scan Running…" : "Run Scan"}
    </Button>
  );
}
