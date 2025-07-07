# Creative Agency Management System

A modern, full-stack web application for managing creative agency operations, built with React, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Features

### Core Functionality
- **User Authentication** - Secure login with Supabase Auth
- **Role-based Access Control** - Admin and staff user roles
- **Real-time Data** - Live updates with Supabase real-time subscriptions
- **Responsive Design** - Mobile-first approach with Tailwind CSS

### Management Modules
- **Dashboard** - Overview of agency performance and key metrics
- **Client Management** - Full CRUD operations for client data
- **Staff Management** - Team member profiles, skills, and utilization tracking
- **Brief Workflow** - Project brief creation and management
- **Billing & Invoices** - Invoice generation and payment tracking
- **Calendar** - Schedule management and event planning
- **Chat** - Internal communication system

### Technical Features
- **Error Handling** - Comprehensive error boundaries and user-friendly error messages
- **Loading States** - Consistent loading indicators throughout the app
- **Empty States** - Helpful empty state components with call-to-action buttons
- **Form Validation** - Client-side and server-side validation
- **Data Persistence** - PostgreSQL database with Row Level Security (RLS)
- **Type Safety** - Full TypeScript implementation

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icons

### Backend & Database
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Relational database
- **Row Level Security (RLS)** - Database-level security
- **Real-time Subscriptions** - Live data updates

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Copy your project URL and anon key
   - Create a `.env.local` file in the root directory:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the database migrations**
   - Execute the SQL schema in your Supabase SQL editor
   - The schema includes tables for users, clients, staff, briefs, invoices, and notifications
   - Row Level Security policies are automatically applied

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Navigate to `http://localhost:5173`
   - The app will automatically redirect to login if not authenticated

## 🗄️ Database Schema

### Tables
- **users** - User accounts and authentication
- **clients** - Client information and contact details
- **staff** - Staff member profiles and skills
- **briefs** - Project briefs and workflow stages
- **invoices** - Billing and payment records
- **notifications** - System notifications and alerts

### Row Level Security (RLS)
- All tables have RLS policies enabled
- Users can only access data they're authorized to see
- Admin users have full access to all data
- Staff users have limited access based on their role

## 🎨 UI Components

### Reusable Components
- **LoadingSpinner** - Consistent loading indicators
- **EmptyState** - Helpful empty state displays
- **ErrorBoundary** - Global error handling
- **Modal** - Reusable modal dialogs
- **Card** - Consistent card layouts

### Design System
- **Color Palette** - Consistent color scheme
- **Typography** - Unified font hierarchy
- **Spacing** - Consistent spacing scale
- **Icons** - Lucide React icon library

## 🔧 Development

### Project Structure
```
src/
├── components/          # React components
│   ├── Auth/           # Authentication components
│   ├── Billing/        # Billing and invoice components
│   ├── Briefs/         # Brief workflow components
│   ├── Calendar/       # Calendar and scheduling
│   ├── Chat/           # Chat and messaging
│   ├── Clients/        # Client management
│   ├── Dashboard/      # Dashboard and analytics
│   ├── Layout/         # Layout and navigation
│   └── Staff/          # Staff management
├── context/            # React context providers
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🚀 Recent Improvements

### Error Handling & State Management
- **Error Boundaries** - Catch and handle unexpected errors gracefully
- **Loading States** - Consistent loading indicators across all pages
- **Empty States** - User-friendly empty state components with actions
- **Error Display** - Clear error messages with dismiss functionality
- **Form Validation** - Comprehensive form validation with error feedback

### CRUD Operations
- **Async Operations** - All CRUD operations are now async with proper error handling
- **Loading Indicators** - Visual feedback during data operations
- **Confirmation Dialogs** - Safe delete operations with confirmation
- **Optimistic Updates** - Immediate UI updates with rollback on error

### User Experience
- **Consistent UI** - Unified design language across all components
- **Responsive Design** - Mobile-first approach with breakpoint optimization
- **Accessibility** - ARIA labels and keyboard navigation support
- **Performance** - Optimized rendering and data fetching

## 🔒 Security

### Authentication
- Supabase Auth with email/password
- JWT token management
- Automatic session handling
- Secure logout functionality

### Data Protection
- Row Level Security (RLS) policies
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the [Issues](https://github.com/your-repo/issues) page
- Create a new issue for bugs or feature requests
- Contact the development team

## 🗺️ Roadmap

### Planned Features
- [ ] Advanced reporting and analytics
- [ ] File upload and management
- [ ] Email notifications
- [ ] Mobile app (React Native)
- [ ] API documentation
- [ ] Unit and integration tests
- [ ] CI/CD pipeline
- [ ] Docker deployment

### Performance Improvements
- [ ] Code splitting and lazy loading
- [ ] Image optimization
- [ ] Caching strategies
- [ ] Bundle size optimization 