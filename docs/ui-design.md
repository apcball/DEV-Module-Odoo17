# Web Monitor Tool - UI Design Mockups

## Design Concept
The design prioritizes clarity, ease of use, and at-a-glance information for monitoring website statuses. The interface will be clean and intuitive, allowing users to quickly assess site health, add new sites, and review historical data. Color coding (green for online, red for offline) will be used to immediately convey status.

---

## Key Screens

### 1. Dashboard (หน้าหลัก)

**Purpose:** To provide an overview of all monitored websites and their current status.

**Layout:** A responsive table or list view.

**Elements:**

*   **Header:**
    *   Title: "Web Monitor Dashboard"
    *   Button: "+ Add New Website" (Prominently placed, e.g., top right)

*   **Website List/Table:** Each row represents a monitored website.
    *   **Website Name:** (e.g., "Google", "Example Corp", "API Server")
    *   **Status:**
        *   🟢 Online
        *   🔴 Offline
    *   **Response Time:** (e.g., "120ms", "N/A" if offline or not checked)
    *   **Last Checked:** (e.g., "2026-02-10 04:35 UTC")
    *   **Actions:**
        *   [Refresh Icon] (Button to trigger an immediate check)
        *   [Edit Icon] (Link to edit website settings)
        *   [Delete Icon] (Button to remove website from monitoring)

**Example Row:**
| Website Name  | Status  | Response Time | Last Checked        | Actions        |
|---------------|---------|---------------|---------------------|----------------|
| Google        | 🟢 Online | 50ms          | 2026-02-10 04:38 UTC | [🔄] [✏️] [🗑️] |
| Example Corp  | 🔴 Offline| N/A           | 2026-02-10 04:30 UTC | [🔄] [✏️] [🗑️] |

---

### 2. Add/Edit Website (หน้าเพิ่ม/แก้ไขเว็บไซต์)

**Purpose:** To configure new websites for monitoring or modify existing ones.

**Layout:** A form overlay or a dedicated page.

**Elements:**

*   **Header:**
    *   Title: "Add New Website" or "Edit Website: [Website Name]"

*   **Form Fields:**
    *   **Website URL:**
        *   Label: `URL`
        *   Input Field: (e.g., `https://www.example.com`) - Required
    *   **Website Name:**
        *   Label: `Name`
        *   Input Field: (e.g., "Example Website") - Required, for display purposes
    *   **Check Interval:**
        *   Label: `Check Interval (minutes)`
        *   Input Field: (e.g., `5`) - Numeric input, default 5 minutes
    *   **Telegram Chat ID for Alerts:**
        *   Label: `Telegram Chat ID`
        *   Input Field: (e.g., `@my_telegram_channel` or `123456789`) - Optional

*   **Action Buttons:**
    *   [Save] (Primary action)
    *   [Cancel] (Secondary action, returns to Dashboard)

---

### 3. Logs (หน้าประวัติ)

**Purpose:** To view a historical log of website checks and alerts.

**Layout:** A paginated, sortable, filterable table.

**Elements:**

*   **Header:**
    *   Title: "Monitoring Logs"
    *   (Optional) Filters: Date range, Website, Status (Online/Offline)

*   **Log Table:**
    *   **Timestamp:** (e.g., "2026-02-10 04:38 UTC")
    *   **Website:** (e.g., "Google")
    *   **Status:**
        *   🟢 Online
        *   🔴 Offline
    *   **Message:** (e.g., "Responded in 50ms." or "Error: Connection timed out.")

**Example Log Entry:**
| Timestamp           | Website      | Status   | Message                                  |
|---------------------|--------------|----------|------------------------------------------|
| 2026-02-10 04:38 UTC| Google       | 🟢 Online | Responded in 50ms.                       |
| 2026-02-10 04:35 UTC| Example Corp | 🔴 Offline| Error: Connection timed out.             |
| 2026-02-10 04:34 UTC| Example Corp | 🔴 Offline| Website returned HTTP 503 Service Unavailable. |

---

## Ready for Implementation
The design concept and key screens have been described using text-based mockups. This is ready for Natjang to implement.
