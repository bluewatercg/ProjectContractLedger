# Invoice System Fixes Implementation Plan

This plan addresses the remaining issues in the invoice system, including improving the `due_date` integration and fixing synchronization issues in the frontend selection components.

## Proposed Changes

### Frontend Components

#### [MODIFY] [ContractSelect.vue](file:///d:/Project/Miller/ProjectContractLedger/apps/frontend/src/components/ContractSelect.vue)
- Update the `customerId` watcher to handle the case where the current selection becomes invalid.
- Ensure the label is cleared when `modelValue` becomes `0` or `null`.

#### [MODIFY] [InvoiceForm.vue](file:///d:/Project/Miller/ProjectContractLedger/apps/frontend/src/views/invoices/InvoiceForm.vue)
- Ensure `due_date` is properly initialized and handled if empty.
- Improve the feedback when switching customers.

#### [MODIFY] [InvoiceList.vue](file:///d:/Project/Miller/ProjectContractLedger/apps/frontend/src/views/invoices/InvoiceList.vue)
- Add the "到期日期" (Due Date) column to the invoice table.

#### [MODIFY] [InvoiceDetail.vue](file:///d:/Project/Miller/ProjectContractLedger/apps/frontend/src/views/invoices/InvoiceDetail.vue)
- Add "到期日期" to the display if it exists.

---

### Backend (Refinement)

#### [MODIFY] [invoice.service.ts](file:///d:/Project/Miller/ProjectContractLedger/apps/backend/src/service/invoice.service.ts)
- Ensure `getOverdueInvoices` logic is consistent with the `due_date` field. (Actually already checked, it looks good).

---

## Verification Plan

### Automated Tests
- I will run existing backend tests if available to ensure no regression.
- Command: `npm run test` in `apps/backend` (Need to verify this command).

### Manual Verification
1. **Create Invoice**:
   - Go to "New Invoice".
   - Select a customer, then select a contract.
   - Set a `due_date` and save.
   - Verify it's saved and displayed in the list.
2. **Customer Switching**:
   - Select a customer and a contract.
   - Change the customer.
   - Verify the contract selection is cleared and the contract dropdown only shows contracts for the new customer.
3. **Overdue Status**:
   - Create an invoice with a past `due_date`.
   - Verify it shows as "逾期" (Overdue) if the status is updated (this might require a background job or manual status update, I'll check if there's an automatic overdue check).
