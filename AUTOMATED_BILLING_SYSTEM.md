# Automated Billing System

## 🎯 Overview

We've successfully implemented a comprehensive automated billing system that handles both **retainer clients** and **project clients** with different billing workflows. The system is fully integrated with the database and provides a user-friendly interface for admin staff to manage billing.

## 🏗️ System Architecture

### Database Schema Enhancements

#### New Tables Created:
1. **`billing_queue`** - Manages pending billing items
2. **`billing_schedule`** - Tracks retainer client billing schedules
3. **`invoice_items`** - Detailed line items for invoices

#### Enhanced Tables:
1. **`clients`** - Added retainer billing fields
2. **`briefs`** - Added project billing stage tracking
3. **`invoices`** - Added automated billing support

### Key Features

## 🔄 Retainer Client Billing

### How It Works:
- **Monthly Billing**: Retainer clients are billed on a specific day each month
- **Automatic Queue**: Added to billing queue automatically each month
- **Admin Review**: Admin staff can review and create invoices from the queue

### Setup Process:
1. Client is created as "retainer" type
2. Admin sets up retainer billing with:
   - Monthly amount
   - Billing day of month (1-31)
   - Start date
3. System automatically adds to billing queue each month

### Database Fields:
```sql
-- clients table additions
retainer_amount DECIMAL(10,2)
retainer_billing_day INTEGER
retainer_start_date DATE
retainer_end_date DATE
retainer_active BOOLEAN
```

## 📋 Project Client Billing

### How It Works:
- **Stage-Based Billing**: 50% → 30% → 20% progression
- **Automatic Triggers**: Billing triggered by brief stage changes
- **Workflow Integration**: Integrated with brief workflow system

### Billing Stages:
1. **Pre-Production** → 50% invoice generated
2. **Amend 1** → 30% invoice generated  
3. **Final Delivery** → 20% invoice generated

### Database Fields:
```sql
-- briefs table additions
billing_stage TEXT -- tracks current billing stage
last_billing_date DATE
project_value DECIMAL(10,2)
```

## 🛠️ Technical Implementation

### 1. Database Functions

#### `generate_invoice_number()`
- Creates unique invoice numbers: `INV-YYYYMM-XXXX`
- Automatically increments for each month

#### `add_retainer_to_billing_queue()`
- Trigger function for retainer clients
- Automatically adds to billing queue when client is created/updated

#### `handle_brief_stage_billing()`
- Trigger function for brief stage changes
- Automatically creates billing queue items for project stages

#### `process_billing_queue()`
- Processes pending billing queue items
- Creates invoices and marks items as processed

#### `get_billing_dashboard_data()`
- Returns billing statistics for dashboard

### 2. Billing Service (`src/lib/billingService.ts`)

Comprehensive service class with methods for:
- Managing billing queue
- Processing automated billing
- Setting up retainer clients
- Creating invoices from queue
- Dashboard statistics

### 3. UI Components

#### `AutomatedBillingQueue.tsx`
- Displays pending billing queue items
- Shows retainer and project billing items
- Allows admin to process queue items
- Provides filtering and statistics

#### `RetainerBillingSetup.tsx`
- Modal for setting up retainer billing
- Real-time billing preview
- Validation and error handling

#### Enhanced `BillingPage.tsx`
- Tabbed interface (Invoices | Automated Billing)
- Integrated automated billing queue
- Enhanced statistics dashboard

## 📊 Billing Queue Management

### Queue Item Types:
1. **Retainer** - Monthly recurring billing
2. **Project-Stage** - Stage-based project billing

### Queue Status:
- **Pending** - Waiting to be processed
- **Processed** - Invoice created
- **Cancelled** - Manually cancelled

### Admin Actions:
- **Create Invoice** - Generate invoice from queue item
- **Cancel** - Cancel queue item with reason
- **Process Queue** - Bulk process all pending items

## 🔧 Setup Instructions

### 1. Database Setup
Run the SQL script in Supabase:
```sql
-- Run automated_billing_setup.sql in Supabase SQL Editor
```

### 2. Environment Variables
Ensure Supabase environment variables are set:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Application Features

#### For Retainer Clients:
1. Create client with type "retainer"
2. Use "Setup Retainer Billing" option
3. Configure monthly amount and billing day
4. System automatically adds to billing queue each month

#### For Project Clients:
1. Create client with type "project"
2. Create briefs with project value
3. System automatically triggers billing at each stage
4. Admin reviews and creates invoices from queue

## 📈 Dashboard Features

### Billing Statistics:
- Total pending amount
- Total overdue amount
- Pending retainer count
- Pending project count
- Overdue invoices count

### Monthly Summary:
- Retainer invoices
- Project stage invoices
- Total revenue
- Total pending

## 🔄 Automation Workflow

### Retainer Workflow:
```
Client Created (retainer) 
    ↓
Setup Retainer Billing
    ↓
Monthly Trigger (billing day)
    ↓
Add to Billing Queue
    ↓
Admin Review & Create Invoice
    ↓
Send to Client
```

### Project Workflow:
```
Brief Created (project client)
    ↓
Brief Advances to Pre-Production
    ↓
50% Invoice Added to Queue
    ↓
Brief Advances to Amend 1
    ↓
30% Invoice Added to Queue
    ↓
Brief Advances to Final Delivery
    ↓
20% Invoice Added to Queue
    ↓
Admin Review & Create Invoices
```

## 🎯 Benefits

### For Admin Staff:
- **Automated Queue**: No manual tracking needed
- **Clear Visibility**: See all pending billing items
- **Bulk Processing**: Process multiple items at once
- **Audit Trail**: Track all billing activities

### For Business:
- **Cash Flow**: Predictable billing cycles
- **Reduced Errors**: Automated calculations
- **Compliance**: Proper VAT handling
- **Scalability**: Handles growth efficiently

## 🔮 Future Enhancements

### Potential Additions:
1. **Email Notifications**: Automatic invoice sending
2. **Payment Integration**: Direct payment processing
3. **Recurring Patterns**: Custom billing schedules
4. **Advanced Analytics**: Billing performance metrics
5. **Multi-Currency**: Support for different currencies

## 🚀 Getting Started

1. **Run Database Setup**: Execute `automated_billing_setup.sql`
2. **Test Retainer Setup**: Create a retainer client and configure billing
3. **Test Project Billing**: Create a project brief and advance through stages
4. **Monitor Queue**: Check the automated billing queue regularly
5. **Process Invoices**: Create invoices from queue items

The system is now ready for production use and will automatically handle billing for both retainer and project clients! 