import { PO_STATUSES, VALID_STATUS_TRANSITIONS } from "./po-constants";

export function getStatusWorkflowInfo(currentStatus?: string): {
  allowedTransitions: string[];
  isTerminal: boolean;
  nextSteps: string[];
} {
  if (!currentStatus) {
    return {
      allowedTransitions: [PO_STATUSES.DRAFT, PO_STATUSES.OPEN],
      isTerminal: false,
      nextSteps: [
        "Create as Draft to continue editing",
        "Create as Open to submit for approval",
      ],
    };
  }

  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  const isTerminal = allowedTransitions.length === 0;

  const nextSteps: string[] = [];
  if (currentStatus === PO_STATUSES.DRAFT) {
    nextSteps.push("Set to Open when ready for approval");
    nextSteps.push("Set to Cancelled if PO needs to be terminated");
  } else if (currentStatus === PO_STATUSES.OPEN) {
    nextSteps.push("Set to Active once approved and vendor is ready");
    nextSteps.push("Set to Cancelled if PO needs to be terminated");
  } else if (currentStatus === PO_STATUSES.ACTIVE) {
    nextSteps.push("Set to Closed when all work is complete");
    nextSteps.push("Set to Cancelled if PO needs to be terminated");
  }

  return {
    allowedTransitions,
    isTerminal,
    nextSteps,
  };
}