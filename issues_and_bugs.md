# Issues and Broken Functionality Audit

This document identifies bugs, crashes, and logical errors currently present in the project.

## 1. Syntax Errors and Build Issues
- **EnhancedOrderForm.tsx**: 
    - CRITICAL: Multiple syntax errors (TypeScript/JSX) around lines 620-630.
    - Error: `JSX element 'Card' has no corresponding closing tag.`
    - Error: `')' expected` and `Expression expected`.
    - Impact: This component fails to compile, likely breaking the entire "Add Order" functionality for entry operators.

## 2. Reporting Issues
- **PT Heating Reports**:
    - Data Visibility: Saved readings for PT heating are not displaying correctly in the report view.
    - Data Mapping: Issues with how PT data is fetched and mapped compared to CT data.
- **QA Test Readings**:
    - Polarity, Megger, HV, and OVIT readings are not showing up in the final report view.
    - Persistence: Data entered during these stages seems to be lost or not correctly associated with the final report generation.

## 3. Workflow Logic Errors
- **Testing Transitions**: 
    - Decoupling "Save" from "Approve" is partially implemented but causes confusion in visibility logic.
    - Transformers sometimes "disappear" from the tester's list before they are officially approved for the next stage.
- **Multi-Transformer Orders**: 
    - Orders containing multiple transformers do not always update the overall order status correctly when individual units complete testing.

## 4. Backend-Frontend Synchronicity
- **State Inconsistency**: Many components update local state (e.g., in a modal) but fail to refresh the parent list or sync with the backend, leading to "stale" data being displayed after an action.
- **Error Handling**: Many try-catch blocks in the frontend log to the console but do not provide user-facing error messages, making it hard for users to know when a backend request failed.

## 5. Technical Debt
- **Debug Scripts Overload**: The backend has over 100 `debug_*.js` and `check_*.js` scripts. This indicates that the core database logic is brittle and frequently requires manual script execution to maintain consistency.
- **TypeScript Errors**: Significant number of TS warnings and errors in `errors.txt` that are currently suppressed or ignored, potentially masking runtime bugs.
