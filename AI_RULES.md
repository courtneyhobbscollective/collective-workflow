# AI Development Rules

This document outlines the core technologies used in this project and provides guidelines for their usage to ensure consistency, maintainability, and best practices.

## Tech Stack Overview

*   **React**: A JavaScript library for building user interfaces.
*   **TypeScript**: A superset of JavaScript that adds static typing, enhancing code quality and developer experience.
*   **Vite**: A fast build tool that provides a lightning-fast development experience.
*   **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs.
*   **shadcn/ui**: A collection of reusable UI components built on Radix UI and styled with Tailwind CSS.
*   **React Router**: For declarative client-side routing within the application.
*   **Supabase**: A backend-as-a-service providing database, authentication, and storage capabilities.
*   **React Query**: For efficient server state management, including data fetching, caching, and synchronization.
*   **Zod**: A TypeScript-first schema declaration and validation library.
*   **Lucide React**: A library for open-source icons, used throughout the application.
*   **Sonner / shadcn/ui Toasts**: For displaying notifications and feedback to the user.

## Library Usage Guidelines

To maintain a consistent and efficient codebase, please adhere to the following guidelines when developing new features or modifying existing ones:

*   **UI Components**:
    *   Always prioritize using components from `shadcn/ui`.
    *   If a required component is not available in `shadcn/ui` or needs significant customization beyond its props, create a new component in `src/components/` using Radix UI primitives and Tailwind CSS. **Do not modify existing `shadcn/ui` component files directly.**
*   **Styling**:
    *   All styling must be done using **Tailwind CSS** utility classes.
    *   Avoid writing custom CSS in separate `.css` or `.scss` files unless it's for global styles defined in `src/index.css`.
*   **Routing**:
    *   Use `react-router-dom` for all navigation.
    *   All main application routes should be defined and managed within `src/App.tsx`.
*   **Data Management (Server State)**:
    *   Use `react-query` for all server-side data fetching, caching, and mutations. This includes interactions with the Supabase database.
*   **Backend Interactions**:
    *   All database operations, authentication, and file storage should be handled via the `supabase` client (`src/integrations/supabase/client.ts`).
*   **Form Handling**:
    *   Use `react-hook-form` for managing form state and submissions.
    *   For form validation, integrate `zod` schemas with `react-hook-form` using `@hookform/resolvers`.
*   **Icons**:
    *   All icons should be imported and used from the `lucide-react` library.
*   **Notifications/Toasts**:
    *   For general user feedback and notifications, use `sonner` (imported as `Toaster` in `App.tsx` and used via `toast` from `sonner`).
    *   The `useToast` hook from `src/components/ui/use-toast.ts` (shadcn/ui's toast system) is also available for specific use cases if preferred.
*   **Date Manipulation**:
    *   Use `date-fns` for all date formatting, parsing, and manipulation tasks.