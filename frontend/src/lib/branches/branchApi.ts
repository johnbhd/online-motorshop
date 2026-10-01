export type CheckoutBranch = {
  id: number;
  name: string;
  address: string;
  contactNumber: string;
  pickupAvailable: boolean;
  status: string;
};

type BranchApiResponse = {
  branches?: unknown;
  message?: unknown;
};

export class BranchApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "BranchApiError";
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseBranch(value: unknown): CheckoutBranch | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "number" ||
    !Number.isInteger(value.id) ||
    typeof value.name !== "string" ||
    typeof value.address !== "string" ||
    typeof value.contact_number !== "string" ||
    typeof value.pickup_available !== "boolean" ||
    typeof value.status !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    address: value.address,
    contactNumber: value.contact_number,
    pickupAvailable: value.pickup_available,
    status: value.status,
  };
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function getCheckoutBranches(): Promise<CheckoutBranch[]> {
  let response: Response;

  try {
    response = await fetch("/api/branches", {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch {
    throw new BranchApiError(0, "Unable to reach the branch service.");
  }

  const body = (await readResponseBody(response)) as BranchApiResponse | null;

  if (!response.ok) {
    const message =
      body && typeof body.message === "string"
        ? body.message
        : "Unable to load ALD branches.";

    throw new BranchApiError(response.status, message);
  }

  if (!body || !Array.isArray(body.branches)) {
    throw new BranchApiError(502, "The branch service returned an invalid response.");
  }

  return body.branches
    .map(parseBranch)
    .filter((branch): branch is CheckoutBranch => branch !== null);
}
