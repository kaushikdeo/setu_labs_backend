# Offline Data Storage in Web Applications Using IndexedDB

## Overview

In a typical web application:

1. User enters data in the frontend.
2. Frontend sends the data to the backend API.
3. Backend stores the data in a database.
4. Dashboard displays the stored data.

However, when internet connectivity is unavailable, the application cannot communicate with the backend. To support offline operation, the frontend can store data locally using **IndexedDB** and synchronize it with the backend once connectivity is restored.

---

# What is IndexedDB?

IndexedDB is a browser-based NoSQL database that allows web applications to store large amounts of structured data locally on a user's device.

Unlike `localStorage`, IndexedDB supports:

* Large storage capacity
* Structured data
* Asynchronous operations
* File and image storage
* Offline-first applications

---

# Where Does IndexedDB Reside?

IndexedDB resides **inside the user's browser on their local device**.

Example:

```text
User Laptop
└── Browser (Chrome/Edge/Firefox/Safari)
    └── IndexedDB
        └── Application Database
```

The data is stored locally and remains available even when the user is offline.

---

# Is IndexedDB Shared Across Users?

No.

Each user has their own local IndexedDB database.

```text
User A Device
└── IndexedDB Database A

User B Device
└── IndexedDB Database B

User C Device
└── IndexedDB Database C
```

Data stored by one user cannot be accessed by another user.

---

# Is IndexedDB Shared Across Browsers?

No.

Each browser maintains its own IndexedDB storage.

Example:

```text
Chrome
└── CRMDatabase

Firefox
└── CRMDatabase
```

Even if the database name is the same, the data is stored separately.

---

# IndexedDB vs LocalStorage

| Feature              | localStorage | IndexedDB              |
| -------------------- | ------------ | ---------------------- |
| Storage Capacity     | ~5-10 MB     | Hundreds of MBs to GBs |
| Structured Data      | Limited      | Excellent              |
| Query Support        | No           | Yes                    |
| Asynchronous         | No           | Yes                    |
| Offline Applications | Not Ideal    | Recommended            |
| Image/File Storage   | No           | Yes                    |

---

# Recommended Architecture

```text
React Application
        │
        ▼
Data Service Layer
        │
        ▼
IndexedDB
        │
 ┌──────┼──────┐
 │      │      │
 ▼      ▼      ▼
Leads Customers Visits
```

All frontend operations read and write to IndexedDB.

---

# Example Record Structure

```json
{
  "id": "uuid-123",
  "customerName": "ABC Industries",
  "visitDate": "2026-08-01",
  "remarks": "Interested in project",
  "syncStatus": "pending",
  "createdAt": "2026-08-01T10:00:00Z",
  "updatedAt": "2026-08-01T10:00:00Z"
}
```

---

# Sync Status Values

| Status  | Meaning                   |
| ------- | ------------------------- |
| pending | Not yet synchronized      |
| synced  | Successfully synchronized |
| failed  | Synchronization failed    |

---

# Why Use UUIDs?

Each record should receive a unique identifier when created.

Example:

```javascript
const id = crypto.randomUUID();
```

Benefits:

* Prevents duplicate records during synchronization
* Supports offline creation
* Enables safe merging with backend data

---

# Saving Data Offline

When the user submits a form while offline:

```javascript
await db.visits.add({
    id: crypto.randomUUID(),
    customerName: "ABC Industries",
    remarks: "Interested",
    syncStatus: "pending",
    createdAt: new Date().toISOString()
});
```

The record is stored locally without requiring internet connectivity.

---

# Reading Data

Dashboard data can be loaded directly from IndexedDB.

```javascript
const visits = await db.visits.toArray();
```

This allows the application to function even when offline.

---

# Updating Data

```javascript
await db.visits.update(id, {
    remarks: "Follow-up scheduled",
    syncStatus: "pending"
});
```

---

# Soft Delete Strategy

Instead of permanently deleting records:

```javascript
await db.visits.update(id, {
    deleted: true,
    syncStatus: "pending"
});
```

This allows the deletion to be synchronized later with the backend.

---

# Sync Queue Pattern

A common approach is to maintain two logical stores.

## Business Data Store

```text
visits
customers
leads
```

Contains actual application data.

## Sync Queue Store

```text
syncQueue
```

Tracks operations that need synchronization.

Example Queue Record:

```json
{
  "id": "queue-1",
  "entity": "visit",
  "entityId": "visit-123",
  "operation": "create",
  "createdAt": "2026-08-01T10:00:00Z"
}
```

---

# Storage Structure Example

```text
IndexedDB
│
├── visits
│   ├── Visit 1
│   ├── Visit 2
│   └── Visit 3
│
├── customers
│
├── leads
│
└── syncQueue
    ├── Create Visit 1
    ├── Update Visit 2
    └── Delete Visit 3
```

---

# Offline Dashboard Strategy

A basic approach:

```javascript
if (navigator.onLine) {
    loadFromAPI();
} else {
    loadFromIndexedDB();
}
```

A better offline-first approach:

```text
UI Always Reads From IndexedDB
```

Whether data originated from:

* Backend API
* Offline entry
* Previous synchronization

the dashboard always uses IndexedDB as its local source of truth.

---

# Handling Images and Attachments

IndexedDB can store:

* Blob
* File
* ArrayBuffer

Example:

```javascript
{
    id: "visit-123",
    imageBlob: Blob
}
```

This enables offline storage of:

* Site photos
* Inspection images
* Documents
* Attachments

---

# Browser Storage Persistence

IndexedDB data remains available when:

* Browser is closed
* Device is restarted
* User goes offline

However, data may be removed if:

* Browser storage is manually cleared
* Browser is uninstalled
* Browser profile is reset
* Enterprise policies wipe browser data

Therefore, IndexedDB should be treated as a local working database and not as the permanent source of truth.

---

# Viewing IndexedDB Data in Chrome

1. Open Developer Tools (F12)
2. Navigate to the **Application** tab
3. Expand **Storage**
4. Expand **IndexedDB**

Example:

```text
Application
└── IndexedDB
    └── CRMDatabase
        ├── Leads
        ├── Customers
        └── Visits
```

This is useful for debugging offline applications.

---

# Key Takeaway

A useful mental model is:

```text
Backend Database  → SQL Server / PostgreSQL / MySQL
Frontend Database → IndexedDB
```

For offline-first web applications, IndexedDB acts as a lightweight local database running inside the user's browser. The application continues to function without internet access, and data can later be synchronized with the backend when connectivity becomes available.
