# IT Ticket Request Web App - Design System

## 🎨 Color Palette

### Primary Colors
| Name | HEX | Usage |
|------|-----|-------|
| Primary | `#2563EB` | Primary buttons, links, active states |
| Primary Dark | `#1D4ED8` | Hover states |
| Primary Light | `#DBEAFE` | Light backgrounds, badges |

### Secondary Colors
| Name | HEX | Usage |
|------|-----|-------|
| Secondary | `#64748B` | Secondary buttons, neutral elements |
| Secondary Dark | `#475569` | Hover states |
| Secondary Light | `#F1F5F9` | Card backgrounds |

### Semantic Colors
| Name | HEX | Usage |
|------|-----|-------|
| Success | `#10B981` | Open, Resolved status |
| Warning | `#F59E0B` | In Progress, Waiting status |
| Danger | `#EF4444` | Critical priority, Cancelled |
| Info | `#3B82F6` | Medium priority |
| Purple | `#8B5CF6` | High priority |

### Neutral Colors
| Name | HEX | Usage |
|------|-----|-------|
| Gray 900 | `#111827` | Primary text |
| Gray 700 | `#374151` | Secondary text |
| Gray 500 | `#6B7280` | Placeholder text |
| Gray 300 | `#D1D5DB` | Borders |
| Gray 100 | `#F3F4F6` | Backgrounds |
| White | `#FFFFFF` | Cards, input backgrounds |

### Status Colors
```
Open:       #10B981 (Success Green)
In Progress:#3B82F6 (Info Blue)
Waiting:    #F59E0B (Warning Orange)
Resolved:   #059669 (Dark Success)
Closed:     #6B7280 (Gray)
Cancelled:  #EF4444 (Danger Red)
```

### Priority Colors
```
Low:      #6B7280 (Gray)
Medium:   #3B82F6 (Blue)
High:     #8B5CF6 (Purple)
Critical: #EF4444 (Red)
```

---

## 🔤 Typography

### Font Family
- **Primary Font**: Inter, -apple-system, BlinkMacSystemFont, sans-serif
- **Monospace Font**: JetBrains Mono, Consolas, monospace (for ticket numbers)

### Font Hierarchy
| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| H1 | 32px | 700 | 1.2 | Page titles |
| H2 | 24px | 600 | 1.3 | Section headers |
| H3 | 20px | 600 | 1.4 | Card titles |
| H4 | 18px | 500 | 1.4 | Subsection |
| Body | 16px | 400 | 1.6 | Body text |
| Small | 14px | 400 | 1.5 | Descriptions |
| XSmall | 12px | 400 | 1.4 | Captions, timestamps |

---

## 📦 Components

### Buttons

#### Primary Button
```
Background: #2563EB
Text: White
Padding: 12px 24px
Border-radius: 8px
Font-weight: 500
Hover: #1D4ED8
Shadow: 0 1px 3px rgba(0,0,0,0.1)
```

#### Secondary Button
```
Background: #F1F5F9
Text: #374151
Border: 1px solid #D1D5DB
Padding: 12px 24px
Border-radius: 8px
Hover: #E2E8F0
```

#### Danger Button
```
Background: #EF4444
Text: White
Hover: #DC2626
```

#### Ghost Button
```
Background: Transparent
Text: #2563EB
Hover: #DBEAFE
```

### Form Inputs

#### Text Input
```
Height: 44px
Padding: 12px 16px
Border: 1px solid #D1D5DB
Border-radius: 8px
Focus: 2px solid #2563EB, border-color: #2563EB
Placeholder: #9CA3AF
```

#### Select/Dropdown
```
Same as Text Input
+ Chevron-down icon (right)
+ Dropdown shadow: 0 10px 15px -3px rgba(0,0,0,0.1)
```

#### Textarea
```
Min-height: 120px
Padding: 12px 16px
Border: 1px solid #D1D5DB
Border-radius: 8px
Resize: vertical
```

### Cards

#### Standard Card
```
Background: White
Border: 1px solid #E5E7EB
Border-radius: 12px
Padding: 24px
Shadow: 0 1px 3px rgba(0,0,0,0.08)
Hover-shadow: 0 4px 6px rgba(0,0,0,0.1)
```

#### Ticket Card
```
Background: White
Border-left: 4px solid [status-color]
Border-radius: 8px
Padding: 16px 20px
Shadow: 0 1px 2px rgba(0,0,0,0.05)
```

### Status Badges

```
Padding: 4px 12px
Border-radius: 9999px (pill)
Font-size: 12px
Font-weight: 500
Text-transform: uppercase

Open:       bg-green-100 text-green-800
In Progress: bg-blue-100 text-blue-800
Waiting:    bg-yellow-100 text-yellow-800
Resolved:   bg-green-100 text-green-900
Closed:     bg-gray-100 text-gray-800
Cancelled:  bg-red-100 text-red-800
```

### Priority Indicators

```
Low:      Gray dot + text
Medium:   Blue dot + text
High:     Purple dot + text
Critical: Red dot + text + optional pulse animation
```

### Tables

```
Header: bg-gray-50, text-gray-700, font-medium
Row: hover:bg-gray-50
Cell-padding: 16px
Border-bottom: 1px solid #E5E7EB
Stripe: even:bg-gray-50/50
```

### Navigation

#### Sidebar
```
Width: 260px
Background: #111827 (dark)
Active-item: bg-gray-800, white text, left-border: 3px #2563EB
Item-hover: bg-gray-800
Icon-size: 20px
Text: 14px
```

#### Top Header
```
Height: 64px
Background: White
Border-bottom: 1px solid #E5E7EB
Shadow: 0 1px 3px rgba(0,0,0,0.05)
```

### Modals

```
Overlay: bg-black/50 backdrop-blur-sm
Modal: bg-white rounded-12 shadow-2xl
Max-width: 560px (default), 720px (large)
Padding: 24px
Close-button: top-right
Animation: fade-in + scale-in
```

### Alerts/Notifications

```
Toast: rounded-lg shadow-lg padding-16
Success: bg-green-50 border-green-200 text-green-800
Error: bg-red-50 border-red-200 text-red-800
Warning: bg-yellow-50 border-yellow-200 text-yellow-800
Info: bg-blue-50 border-blue-200 text-blue-800
```

---

## 📐 Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight spacing, icon gaps |
| sm | 8px | Compact elements |
| md | 16px | Standard gaps |
| lg | 24px | Section gaps |
| xl | 32px | Large sections |
| 2xl | 48px | Page sections |
| 3xl | 64px | Major divisions |

---

## 🎯 Shadows

| Token | Value | Usage |
|-------|-------|-------|
| sm | 0 1px 2px rgba(0,0,0,0.05) | Subtle elevation |
| md | 0 4px 6px rgba(0,0,0,0.07) | Cards, dropdowns |
| lg | 0 10px 15px rgba(0,0,0,0.1) | Modals, popovers |
| xl | 0 20px 25px rgba(0,0,0,0.15) | Floating elements |

---

## 🔲 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| sm | 4px | Tags, badges |
| md | 8px | Buttons, inputs |
| lg | 12px | Cards, modals |
| xl | 16px | Large cards |
| full | 9999px | Pills, avatars |

---

## 📱 Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| Mobile | < 640px | Phones |
| Tablet | 640px - 1024px | Tablets, small laptops |
| Desktop | 1024px - 1280px | Standard screens |
| Large | > 1280px | Wide screens |

---

## 🎬 Animations

### Transitions
```
Default: transition-all duration-200 ease-in-out
Button-hover: transform scale-[1.02]
Card-hover: transform translateY(-2px)
Modal: opacity 0→1, scale 0.95→1, duration-200
Toast: slide-in from right, duration-300
```

### Loading States
```
Skeleton: bg-gray-200 animate-pulse rounded-md
Spinner: border-2 border-gray-300 border-t-blue-600 animate-spin rounded-full
Progress: striped animated bar
```

---

## 🖼️ Icons

- **Library**: Lucide React (or Heroicons)
- **Size**: 16px (small), 20px (default), 24px (large)
- **Stroke-width**: 2px

### Key Icons
| Icon | Usage |
|------|-------|
| Ticket | Tickets menu |
| Plus | Create new |
| Search | Search bar |
| Filter | Filter button |
| Bell | Notifications |
| User | Profile |
| Settings | Settings |
| LogOut | Sign out |
| MessageSquare | Comments |
| Paperclip | Attachments |
| Clock | History/SLA |
| CheckCircle | Resolved |
| AlertCircle | Critical |
| MoreHorizontal | Actions menu |

---

## 📝 Content Guidelines

### Language
- Clear, concise Thai/English
- Action-oriented button text: "สร้าง Ticket", "บันทึก", "ยกเลิก"
- Avoid jargon where possible

### Empty States
- Friendly illustrations
- Helpful CTA: "สร้าง Ticket แรกของคุณ"
- Clear explanation of next steps

### Error Messages
- Specific: "กรุณากรอกหัวข้อ Ticket"
- Helpful: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"
- Non-blaming: "ไม่พบข้อมูล กรุณาลองใหม่อีกครั้ง"
