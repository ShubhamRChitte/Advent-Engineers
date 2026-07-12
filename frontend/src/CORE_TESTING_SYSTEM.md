# Core Testing Tracking System

## Overview
This comprehensive core testing tracking system enables Advent Engineers to manage and track transformer cores through their complete testing lifecycle with automatic ID generation, printable labels, and detailed test reporting.

## Key Features

### 1. **Automatic Core ID Generation**
- **Format**: `AE-{DDMMYY}-{TYPE}-{NUMBER}`
- **Example IDs**:
  - Metering: `AE-130126-MTR-001`, `AE-130126-MTR-002`
  - PS: `AE-130126-PS-001`, `AE-130126-PS-002`
  - Protection: `AE-130126-PRT-001`, `AE-130126-PRT-002`
- Unique identifiers generated based on:
  - Current date
  - Core type (Metering/PS/Protection)
  - Sequential numbering

### 2. **Core Configuration Based on Order**
When an order is placed:
- **Example**: Tata Power orders 10 transformers
- Each transformer requires 3 cores:
  - 1 Metering core
  - 2 PS cores
  - 0 Protection cores (if not required)
- **Total Generated**:
  - 10 Metering core IDs (AE-130126-MTR-001 to MTR-010)
  - 20 PS core IDs (AE-130126-PS-001 to PS-020)

### 3. **Printable Core Labels**
Professional labels include:
- Company branding (Advent Engineers)
- Core ID (barcode-ready format)
- Order information
- Client name
- Core type
- Serial number (e.g., "1 of 10")
- Date stamp
- QR code placeholder
- ISO certification mark

**Label Features**:
- A4 page format (3x3 grid = 9 labels per page)
- Easy to print and stick on transformers
- Durable design for production environment
- Clear typography for scanning

### 4. **Toroidal Core Testing Form**
Based on the standard testing format with sections:

#### **Header Information**
- Description
- Core Size in MM (e.g., 100 x 200 x 85)
- Turn Used for Testing (default: 10 Turns)
- Core type identifier (e.g., M4CRGO, ID-OD-HT)

#### **Specification Section**
- Area (Sq cm): e.g., 41.225
- MMP (cm): e.g., 47.1

#### **B (Flux in Tesla) Section**
- Voltage (V): e.g., 7.04
- Lex limit (m A): e.g., 1696

#### **Test Results Table**
Multiple test entries with:
- Core Vendor No
- Internal Core No
- Test Value
- P/F (Pass/Fail) indicator

#### **Final Result**
- Automatic calculation based on all P/F entries
- Overall PASS/FAIL determination
- All must be P for overall PASS

### 5. **Core Testing Workflow**

#### **Step 1: Order Details → Start Core Testing**
From the Order Details page:
1. Click "Start Core Testing" button
2. System displays available testing types based on order configuration

#### **Step 2: Core Testing Initiation**
View shows:
- Total cores required for each type (Metering, PS, Protection)
- Auto-generated core IDs for each type
- Testing progress (Tested vs Pending)
- Two action buttons per type:
  - **Print IDs**: Opens printable labels dialog
  - **Start Testing**: Begins testing workflow

#### **Step 3: Print Core ID Labels**
1. Select core type (Metering/PS/Protection)
2. Preview all labels in dialog
3. Click "Print All Labels"
4. Labels open in new window for printing
5. Stick labels on physical cores

#### **Step 4: Start Testing**
1. Click "Start Testing" for a core type
2. Select a specific core ID from the list
3. Opens Toroidal Core Testing Form
4. Fill in all required fields:
   - Specifications
   - Test parameters
   - Multiple test results
5. System auto-calculates PASS/FAIL
6. Save & Complete

#### **Step 5: Core Tracking**
Admin dashboard shows:
- All cores across all orders
- Current testing status
- Pass/Fail results
- Testing progress statistics
- Searchable and filterable view

### 6. **Core Tracking Dashboard**
Comprehensive overview including:

#### **Statistics**
- Total cores in system
- Pending tests
- In Progress tests
- Completed tests
- Failed tests
- Overall pass rate percentage

#### **Filter Options**
- By core type (Metering/PS/Protection)
- By status (Pending/In Progress/Completed/Failed)
- By order ID
- By client name
- By date range

#### **Core Records Table**
Displays:
- Core ID
- Core Type (with icon)
- Order ID
- Client Name
- Test Status
- Test Result (PASS/FAIL)
- Test Date
- Tested By (employee name)
- Action buttons (View Report/Start Test)

### 7. **Status Flow**

```
Pending → In Progress → Completed (PASS)
                     ↓
                  Failed (FAIL)
```

- **Pending**: Core ID generated, testing not started
- **In Progress**: Testing form opened, data being entered
- **Completed**: Testing done, result is PASS
- **Failed**: Testing done, result is FAIL (can be retested)

### 8. **Integration Points**

#### **With Entry Level Module**
- Order creation defines core configuration
- Core quantities calculated from transformer count
- Automatic core allocation per order

#### **With Admin Module**
- Order approval triggers core ID generation
- Admin can view all core testing progress
- Comprehensive reporting and analytics

#### **With Tester Modules**
- Core testers receive notifications
- Each core can be assigned to specific testers
- Testing progress tracked per employee

### 9. **Reports and Export**

#### **Individual Core Report**
- PDF export of testing form
- Company branding
- Complete test data
- PASS/FAIL result
- Tester signature section
- Timestamp

#### **Batch Reports**
- Export all cores for an order
- Filter by status/type/date
- CSV/Excel export for analysis
- Summary statistics

### 10. **Future Enhancements**
- QR code generation for labels
- Mobile app for scanning cores
- Photo upload for test evidence
- Automated email notifications
- Integration with inventory system
- Historical trend analysis
- Predictive failure detection

## Usage Instructions

### For Entry Operators
1. Create order with transformer quantity
2. Define core configuration (types needed)
3. System auto-generates core IDs
4. Print core labels
5. Attach labels to physical cores

### For Testers
1. Receive notification of pending cores
2. Select core from list
3. Complete testing form
4. Submit results
5. System calculates PASS/FAIL
6. Core moves to next stage or marked complete

### For Admins
1. Monitor all cores in dashboard
2. View testing statistics
3. Track progress per order
4. Generate reports
5. Approve/reject test results
6. Assign/reassign testers

## Technical Details

### Core ID Format
- **Prefix**: AE (Advent Engineers)
- **Date**: DDMMYY (13th Jan 2026 = 130126)
- **Type Code**:
  - MTR: Metering
  - PS: Power Supply
  - PRT: Protection
- **Serial**: 001-999 (auto-incremented)

### Data Storage
Each core record contains:
```typescript
{
  coreId: string;           // Unique identifier
  coreType: string;         // Metering/PS/Protection
  orderId: string;          // Parent order
  clientName: string;       // Customer name
  testStatus: string;       // Pending/In Progress/Completed/Failed
  testDate: Date;           // When tested
  testedBy: string;         // Employee name
  result: string;           // PASS/FAIL
  testData: {               // Full test form data
    specifications: {...},
    testResults: [...],
    remarks: string
  }
}
```

## Benefits

1. **Traceability**: Every core tracked from creation to testing
2. **Efficiency**: Automatic ID generation saves time
3. **Accuracy**: Structured testing forms reduce errors
4. **Compliance**: Professional reports for audits
5. **Visibility**: Real-time status across organization
6. **Quality**: Comprehensive P/F tracking ensures standards
7. **Productivity**: Quick access to pending tests
8. **Documentation**: Complete testing history preserved

---

**Version**: 1.0  
**Last Updated**: January 13, 2026  
**Contact**: Advent Engineers IT Team
