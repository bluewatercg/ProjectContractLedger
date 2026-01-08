# Dashboard Visualization Enhancement Plan

This plan aims to improve the dashboard to provide a better overview of the business situation, specifically focusing on revenue trends and payment collection.

## Proposed Changes

### Backend Enhancements

#### [MODIFY] [statistics.service.ts](file:///d:/Project/Miller/ProjectContractLedger/apps/backend/src/service/statistics.service.ts)
- Implement `getMonthlyRevenueTrend` using actual TypeORM queries (grouped by month).
- Implement `getInvoiceStatusDistribution` and `getContractStatusDistribution` with real data.
- Implement `getCustomerContribution` to show top customers by revenue.

### Frontend Enhancements

#### [MODIFY] [Dashboard.vue](file:///d:/Project/Miller/ProjectContractLedger/apps/frontend/src/views/Dashboard.vue)
- Add a new "Charts" section.
- Implement a **Revenue & Collection Trend** line chart using ECharts.
- Implement a **Invoice Status Distribution** pie chart.
- Implement a **Top 5 Customers** horizontal bar chart.
- Refine stat cards to be more visually appealing and informative.

---

## Verification Plan

### Automated Verification
- I will check the API responses using the `test-api.js` script or similar to ensure the new statistics endpoints return correct data.

### Manual Verification
1. **Visual Check**: Open the dashboard and verify that charts are rendered correctly and look premium.
2. **Data Consistency**: Verify that the totals in the charts match the numbers in the stat cards.
3. **Interactivity**: Test hover effects and legend toggling on the charts.
