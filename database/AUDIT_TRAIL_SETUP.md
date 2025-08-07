# Listing Audit Trail Setup Guide

This guide explains how to set up the audit trail system for tracking listing changes and deletions.

## Overview

The audit trail system automatically tracks:
- **Listing Deletions**: When a listing is soft-deleted (status changed to 'deleted')
- **Status Changes**: When listing status changes (active → sold, etc.)
- **Content Updates**: When important fields like title, price, or description are modified

## Setup Instructions

### 1. Apply the Audit Trail Migration

Run the following SQL migration in your Supabase SQL Editor:

```sql
-- Copy and paste the entire content from:
database/migrations/005_create_listing_audit_trail.sql
```

### 2. Verify the Setup

After running the migration, you should see:

1. **New Table**: `listing_audit_trail` in your database
2. **New Function**: `create_listing_audit_entry()`
3. **New Trigger**: `create_listing_audit_entry_trigger`

### 3. Test the Audit Trail

1. **Update a Listing**: Modify title or price
2. **Delete a Listing**: Set status to 'deleted'
3. **Check Audit Trail**: Query the `listing_audit_trail` table

```sql
-- View recent audit entries
SELECT 
  lat.*,
  l.title as listing_title
FROM listing_audit_trail lat
LEFT JOIN listings l ON lat.listing_id = l.id
ORDER BY lat.performed_at DESC
LIMIT 10;
```

## Audit Trail Fields

| Field | Description |
|-------|-------------|
| `listing_id` | ID of the affected listing |
| `user_id` | ID of the listing owner |
| `action` | Type of action: 'deleted', 'updated', 'status_changed' |
| `old_data` | Previous values (JSON) |
| `new_data` | New values (JSON) |
| `reason` | Human-readable description |
| `performed_by` | ID of user who made the change |
| `performed_at` | Timestamp of the action |
| `metadata` | Additional context (JSON) |

## Automatic Tracking

The system automatically creates audit entries for:

### Deletions
```json
{
  "action": "deleted",
  "reason": "User deleted listing",
  "old_data": { /* complete listing data */ },
  "new_data": { /* listing with status='deleted' */ }
}
```

### Status Changes
```json
{
  "action": "status_changed", 
  "reason": "Status changed from active to sold",
  "old_data": {"status": "active"},
  "new_data": {"status": "sold"}
}
```

### Content Updates
```json
{
  "action": "updated",
  "reason": "Listing details updated", 
  "old_data": {"title": "Old Title", "price": 1000},
  "new_data": {"title": "New Title", "price": 1500},
  "metadata": {"fields_changed": ["title", "price"]}
}
```

## Querying the Audit Trail

### Get All Changes for a Listing
```sql
SELECT * FROM listing_audit_trail 
WHERE listing_id = 'your-listing-id'
ORDER BY performed_at DESC;
```

### Get All Deletions
```sql
SELECT * FROM listing_audit_trail 
WHERE action = 'deleted'
ORDER BY performed_at DESC;
```

### Get Changes by User
```sql
SELECT * FROM listing_audit_trail 
WHERE performed_by = 'user-id'
ORDER BY performed_at DESC;
```

### Daily Deletion Report
```sql
SELECT 
  DATE(performed_at) as date,
  COUNT(*) as deletions_count
FROM listing_audit_trail 
WHERE action = 'deleted'
  AND performed_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(performed_at)
ORDER BY date DESC;
```

## Security

- **Row Level Security**: Users can only view audit entries for their own listings
- **Automatic Tracking**: Entries are created automatically by database triggers
- **Immutable Records**: Audit entries cannot be modified once created
- **User Context**: Tracks which user performed each action

## Maintenance

### Archiving Old Audit Data
```sql
-- Archive audit data older than 2 years
DELETE FROM listing_audit_trail 
WHERE performed_at < NOW() - INTERVAL '2 years';
```

### Storage Considerations
- Audit entries are stored as JSONB for efficiency
- Consider partitioning by date for very large datasets
- Monitor table size and implement archiving as needed

## Benefits

1. **Compliance**: Full audit trail for regulatory requirements
2. **Debugging**: Track down issues with listing changes
3. **Analytics**: Understand user behavior patterns
4. **Recovery**: Restore deleted listings if needed
5. **Accountability**: Know who made what changes when

## Integration with App

The audit trail works automatically - no additional code needed in your React Native app. When users:

- Edit listings through `EditListingModal`
- Delete listings through `MyListingsModal`
- Change listing status programmatically

All changes are automatically logged to the audit trail table.
