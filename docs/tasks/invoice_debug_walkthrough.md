# Invoice System Fixes Walkthrough

I have completed the tasks to fix and improve the invoice system. The changes focus on the `due_date` integration and improving the user experience during customer/contract selection.

## Changes Made

### Frontend

#### 1. Contract Selection Logic ([ContractSelect.vue](file:///d:/Project/Miller/ProjectContractLedger/apps/frontend/src/components/ContractSelect.vue))
- Added a robust watcher for `customerId`. If the customer ID changes, the component now:
  - Verifies if the currently selected contract still belongs to the new customer *before* clearing the list (optimized to reuse current data when possible).
  - Clears the internal `contracts` list and resets pagination.
  - Clears the selection if the contract is no longer valid for the selected customer.

#### 2. API Type Synchronization ([types.ts](file:///d:/Project/Miller/ProjectContractLedger/apps/frontend/src/api/types.ts))
- Synchronized frontend `Invoice` and `CreateInvoiceDto` types with the backend to include `due_date`.
- Added `tax_amount` and `total_amount` to `UpdateInvoiceDto` to match backend expectations.

#### 3. Invoice Form Refinement ([InvoiceForm.vue](file:///d:/Project/Miller/ProjectContractLedger/apps/frontend/src/views/invoices/InvoiceForm.vue))
- Improved `handleCustomerChange` to provide feedback (`ElMessage.info`) when the contract selection is reset due to a customer change.
- Verified date handling logic (`issue_date`, `due_date`) for consistency.

#### 4. Data Display ([InvoiceList.vue](file:///d:/Project/Miller/ProjectContractLedger/apps/frontend/src/views/invoices/InvoiceList.vue) & [InvoiceDetail.vue](file:///d:/Project/Miller/ProjectContractLedger/apps/frontend/src/views/invoices/InvoiceDetail.vue))
- Added the "到期日期" (Due Date) column to the Invoice List table.
- Added "到期日期" to the Invoice Detail description section.

## Verification Results

### Manual Test Steps

1. **Integrated Customer/Contract Flow**:
   - Navigate to `/invoices/create`.
   - Select a customer.
   - Select a contract from the dropdown (only contracts for that customer appear).
   - Change the customer.
   - **Expected**: A message appears saying "已重置合同选择", and the contract field is cleared.

2. **Due Date Integration**:
   - Create a new invoice and fill in the "到期日期" (Due Date).
   - Save the invoice.
   - **Expected**: The invoice is saved successfully.
   - View the invoice list.
   - **Expected**: The "到期日期" column shows the date you entered.
   - Click "查看" (View) for the invoice.
   - **Expected**: The detail page shows the "到期日期".

> [!NOTE]
> The backend was already prepared with the `due_date` field in the entity and DTOs. These frontend changes complete the integration.
