# IT Ticket Request - Frontend

Frontend application for IT Ticket Request System

## 📁 Project Structure

```
frontend/
├── css/
│   └── main.css              # Main stylesheet with Design System
├── js/
│   ├── api.js                # API service for backend communication
│   └── utils.js              # Utility functions
├── pages/
│   ├── login.html            # Login & Register page
│   ├── dashboard.html        # Dashboard with statistics
│   ├── tickets.html          # Ticket list with filters
│   ├── ticket-detail.html    # Ticket detail & comments
│   ├── create-ticket.html    # Create new ticket form
│   └── profile.html          # User profile & settings
├── assets/
│   └── images/               # Images and icons
└── index.html                # Entry point (redirects to login)
```

## 🚀 Getting Started

### Prerequisites

- Backend API server running (default: http://localhost:3000/api)
- Modern web browser with JavaScript enabled

### Installation

1. Clone the repository
2. Serve the frontend using any static server:

**Using Python:**
```bash
python -m http.server 8000
```

**Using Node.js:**
```bash
npx serve
```

**Using VS Code Live Server extension:**
- Right-click on `index.html`
- Select "Open with Live Server"

3. Open http://localhost:8000 in your browser

## 🎨 Design System

The application uses a comprehensive Design System with:

- **Colors:** Primary, secondary, status, priority colors
- **Typography:** Inter font family with scale
- **Components:** Buttons, forms, cards, badges, tables, modals, etc.
- **Responsive:** Mobile-first design for all screen sizes

All styles are defined in `css/main.css` with CSS variables for easy customization.

## 📡 API Integration

All API calls are handled through the API service (`js/api.js`):

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/me` - Get current user
- `PUT /auth/me` - Update profile
- `POST /auth/change-password` - Change password

### Tickets
- `GET /tickets` - Get all tickets with filters
- `GET /tickets/:id` - Get single ticket
- `POST /tickets` - Create new ticket
- `PUT /tickets/:id` - Update ticket
- `DELETE /tickets/:id` - Delete ticket
- `PATCH /tickets/:id/status` - Update status
- `PATCH /tickets/:id/assign` - Assign ticket
- `GET /tickets/:id/comments` - Get comments
- `POST /tickets/:id/comments` - Add comment

### Categories
- `GET /categories` - Get all categories
- `GET /categories/:id` - Get single category

### Reports
- `GET /reports/dashboard` - Get dashboard statistics
- `GET /reports/stats` - Get ticket statistics

### Users
- `GET /users` - Get all users (admin/agent only)

## 🔧 Configuration

Update API base URL in `js/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:3000/api'; // Change this
```

## 📱 Responsive Design

The application is fully responsive and works on:

- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

## 🔐 Security Features

- JWT token-based authentication
- Token stored in localStorage
- Automatic redirect to login if not authenticated
- Role-based access control (admin/agent/user)

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🐛 Known Issues

None reported

## 📝 Development Notes

- Pure HTML/CSS/JavaScript (no frameworks)
- Uses Fetch API for HTTP requests
- Vanilla JS with utility functions
- CSS variables for theming
- Mobile-first responsive design

## 👥 Roles

- **Admin:** Full access to all features
- **Agent:** Can manage tickets, assign, update status
- **User:** Can create and view own tickets

## 📄 Pages

1. **Login/Register** (`login.html`)
   - User authentication
   - New user registration
   - Forgot password

2. **Dashboard** (`dashboard.html`)
   - Ticket statistics
   - Recent tickets
   - Quick actions

3. **Ticket List** (`tickets.html`)
   - Filterable ticket list
   - Search functionality
   - Pagination

4. **Ticket Detail** (`ticket-detail.html`)
   - Full ticket information
   - Comment thread
   - Status updates
   - File attachments

5. **Create Ticket** (`ticket-create.html`)
   - New ticket form
   - Priority selection
   - Category selection
   - File upload support

6. **Profile** (`profile.html`)
   - User information
   - Profile settings
   - Password change

## 🎯 Features

- ✅ User authentication (login/register)
- ✅ Ticket CRUD operations
- ✅ Real-time status updates
- ✅ Comment system
- ✅ File attachments
- ✅ Advanced filtering
- ✅ Search functionality
- ✅ Pagination
- ✅ Responsive design
- ✅ Role-based access control
- ✅ Dashboard statistics

## 📞 Support

For issues or questions, please contact the development team.

---

**Built with ❤️ by Pixel Development Team**
