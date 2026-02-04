import { getStatusWorkflowInfo } from '@/lib/po-workflow';
import { PO_STATUSES } from '@/lib/po-constants';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error('FAIL:', message);
    process.exit(1);
  }
}

function run() {
  const infoNew = getStatusWorkflowInfo(undefined);
  console.log('New:', infoNew);
  assert(!infoNew.isTerminal, 'New should not be terminal');
  assert(infoNew.nextSteps.includes('Create as Draft to continue editing'), 'New should suggest Draft');
  assert(infoNew.nextSteps.includes('Create as Open to submit for approval'), 'New should suggest Open');

  const infoDraft = getStatusWorkflowInfo(PO_STATUSES.DRAFT);
  console.log('Draft:', infoDraft);
  assert(!infoDraft.isTerminal, 'Draft should not be terminal');
  assert(infoDraft.nextSteps.includes('Set to Open when ready for approval'), 'Draft should suggest Open');

  const infoOpen = getStatusWorkflowInfo(PO_STATUSES.OPEN);
  console.log('Open:', infoOpen);
  assert(!infoOpen.isTerminal, 'Open should not be terminal');
  assert(infoOpen.nextSteps.includes('Set to Active once approved and vendor is ready'), 'Open should suggest Active');

  const infoActive = getStatusWorkflowInfo(PO_STATUSES.ACTIVE);
  console.log('Active:', infoActive);
  assert(!infoActive.isTerminal, 'Active should not be terminal');
  assert(infoActive.nextSteps.includes('Set to Closed when all work is complete'), 'Active should suggest Closed');

  const infoClosed = getStatusWorkflowInfo(PO_STATUSES.CLOSED);
  console.log('Closed:', infoClosed);
  assert(infoClosed.isTerminal, 'Closed should be terminal');

  const infoCancelled = getStatusWorkflowInfo(PO_STATUSES.CANCELLED);
  console.log('Cancelled:', infoCancelled);
  assert(infoCancelled.isTerminal, 'Cancelled should be terminal');

  console.log('All PO workflow unit tests passed');
}

run();
