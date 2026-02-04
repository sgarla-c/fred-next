/**
 * PO Status workflow definitions
 */
export const PO_STATUSES = {
  DRAFT: "Draft",
  OPEN: "Open",
  ACTIVE: "Active",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
} as const;

export type POStatus = typeof PO_STATUSES[keyof typeof PO_STATUSES];

/**
 * Valid status transitions for PO workflow
 * Maps current status to allowed next statuses
 */
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  [PO_STATUSES.DRAFT]: [PO_STATUSES.OPEN, PO_STATUSES.CANCELLED],
  [PO_STATUSES.OPEN]: [PO_STATUSES.ACTIVE, PO_STATUSES.CANCELLED],
  [PO_STATUSES.ACTIVE]: [PO_STATUSES.CLOSED, PO_STATUSES.CANCELLED],
  [PO_STATUSES.CLOSED]: [], // Terminal state
  [PO_STATUSES.CANCELLED]: [], // Terminal state
};
