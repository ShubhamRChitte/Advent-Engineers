# Static Functionality Audit

This document outlines the areas in the Advent Engineers project where the functionality is currently static, hardcoded, or relies on mock data instead of live backend integration.

## 1. Dashboard Components
The main dashboard and its variations contain mostly hardcoded statistics and charts.
- **Stats Cards**: `Current Orders`, `Active Workers`, `Pending Tests`, and `Dispatched Today` values are hardcoded in `src/components/Dashboard.tsx` and `src/components/admin/AdminDashboard.tsx`.
- **Production Overview Chart**: Data points for the line chart are static arrays.
- **Transformer Distribution Pie Chart**: Values and categories are hardcoded.
- **Testing Progress Bar Chart**: Stages and counts are mock data.
- **Recent Activity**: The list of activities is a static array.

## 2. Order Management
- **Orders View**: The list of orders in `src/components/OrdersView.tsx` is driven by a hardcoded `orders` array.
- **Order Details**: While a modal exists, it only displays information from the static orders list.
- **Filtering**: The filter logic works on the local static array but is not linked to backend queries.

## 3. Testing Workflow
- **Process Overview**: The descriptions and durations for the 4-stage testing process are static.
- **Active Tests List**: The items shown in `src/components/TestingWorkflow.tsx` are hardcoded models.
- **Progress Tracking**: The progress bars and status badges are rendered based on mock data.

## 4. Administrative Views
- **Workers/Employees Management**: Tables showing workers and their status often contain placeholder names and stats.
- **Inventory/Stock Management**: Items, quantities, and status are mostly static placeholders in `EnhancedStockManagement.tsx`.
- **Calendar View**: Events and schedules are mocked.

## 5. Reports Module
- **Reports List**: The overview of available reports often falls back to static examples if the backend fetch fails or is not implemented.
- **Report Templates**: Some layout sections in `AdminReportViewPage.tsx` use static text where dynamic transformer data should be.

## 6. Missing API Integrations
- **Form Submissions**: Some "Submit" buttons log to console or show a toast but do not persist data to the database.
- **Real-time Updates**: Notifications and status changes are mostly UI-driven without polling or WebSocket support.
