import { ScanEntity } from "@/domain/entities/scan.entity";
import { type IScanRepository } from "@/domain/repositories/scan.repository";
import {
  GetScanInputSchema,
  type GetScanInput,
} from "@/application/scan/scan.schema";
import { NotFoundError } from "@/application/common/errors";

export interface GetScanResult {
  scan: ScanEntity;
}

/**
 * ── GetScanUseCase ──────────────────────────────────────
 *  Returns a single scan by its ID.
 * ────────────────────────────────────────────────────────
 */
export class GetScanUseCase {
  constructor(private readonly scanRepo: IScanRepository) {}

  async execute(input: GetScanInput): Promise<GetScanResult> {
    // 1. Validate input
    const parsed = GetScanInputSchema.parse(input);

    // 2. Fetch scan
    const scan = await this.scanRepo.findById({ id: parsed.id });
    if (!scan) {
      throw new NotFoundError("Scan", parsed.id);
    }

    return { scan };
  }
}
