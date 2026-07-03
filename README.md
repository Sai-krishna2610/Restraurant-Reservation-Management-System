# Restaurant Reservation Management System

A full-stack web application designed for restaurant managers to control table bookings and for customers to reserve tables at custom times.

## Project Overview

This repository contains the Restaurant Reservation Management System. It allows customers to register, check table availability for specific dates and custom time ranges (e.g., 18:30 to 20:00), select their preferred table, and confirm reservations. The backend enforces seating capacity restrictions and a minimum 15-minute buffer between bookings on the same table. It also features a fully-fledged administrative dashboard for managers to oversee all reservations, filter bookings by date, modify reservation details, and add or delete tables.

---

## Technology Stack

- **Frontend**: React, built using Vite.
- **Backend**: Node.js, built using Express.
- **Database**: MongoDB (configured with Mongoose schemas and compound index optimizations).
- **Authentication**: JWT (JSON Web Tokens) with encrypted password storage via bcryptjs.
- **Styling**: Modern, responsive Vanilla CSS incorporating a glassmorphic dark-theme design.

---

## Features

### Customer Flow
- **Account Registration & Authentication**: Secure sign-up and sign-in.
- **Dynamic Table Selection**: Inputs for date, start time, end time, and guest count query the API for available tables matching the criteria.
- **Visual Table Booking**: Available tables are displayed as selectable cards showing seating capacity.
- **Reservation History**: List of active and historical reservations with an option to cancel.

### Administrator Flow
- **Distinct Visual Styling**: The interface shifts to an administrative design to prevent confusion.
- **Reservation Monitoring**: View all system reservations, sorted chronologically.
- **Date Filtering**: Filter reservations for any single calendar day.
- **Modify Bookings**: A modal interface allows modifying reservation date, times, guest counts, statuses, and overriding table assignments.
- **Table Management**: Control the restaurant layout by adding new tables with custom capacities or deleting existing tables.

---

## Setup & Running Locally

### Prerequisites
- Node.js (v16+) installed on your machine.
- MongoDB running locally (default URI: `mongodb://127.0.0.1:27017/restaurant-reservation`).

### Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env` (a default `.env` file is already created for you with fallback settings). The parameters include:
   - `PORT`: Server port (default: `5001`)
   - `MONGO_URI`: MongoDB connection string
   - `JWT_SECRET`: Secret key for token verification
4. Start the server:
   ```bash
   npm run dev
   ```
   *The backend will boot on port `5001` and automatically seed initial tables and test accounts if the database is empty.*

### Frontend Setup
1. Open another terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will boot on `http://localhost:5173/`.*

### Pre-seeded Credentials
To make testing easier, the system automatically seeds the following credentials on its first startup:
- **Administrator Account**:
  - **Email**: `admin@restaurant.com`
  - **Password**: `adminpassword`
- **Test Customer Account**:
  - **Email**: `customer@restaurant.com`
  - **Password**: `customerpassword`

---

## Assumptions Made

During development, the following assumptions were made to scope the reservation logic:
1. **Operating Hours**: The restaurant is open and accepts reservations strictly between **11:00 AM and 11:00 PM** (`11:00` to `23:00`). Bookings outside this window are rejected.
2. **Single-Day Boundaries**: Reservations must start and end on the same calendar day. Multi-day bookings or reservations spanning past midnight (e.g., 10:00 PM to 1:00 AM the next day) are not supported.
3. **Table Capacity Fit**: A table is only considered eligible if its seating capacity is greater than or equal to the requested number of guests. Tables are not automatically merged or split to match guest counts.
4. **Buffer Gap**: A hardcoded 15-minute gap must exist between reservations on the same table. It is assumed that this duration is sufficient for cleaning, resetting, and welcoming the next party.
5. **No Parallel Bookings**: A customer user should be able to book multiple tables, but they must do so via individual bookings.

---

## Explanation of Reservation and Availability Logic

The core availability logic is managed in `backend/controllers/reservationController.js` and revolves around ensuring no double bookings occur while honoring the 15-minute preparation buffer.

### 1. Capacity Filtering
When a request is made for `guests` count, the system queries the `tables` collection and filters out any table where:
$$\text{Table Seating Capacity} < \text{Requested Guests}$$

### 2. Time Collision & Buffer Formula
To check if a specific table is available during a requested time interval $[T_{\text{reqStart}}, T_{\text{reqEnd}}]$ on a given date:
1. All active bookings (`status: 'booked'`) for that table and date are fetched from the database.
2. Time strings (e.g. `"18:30"`) are converted into minutes from midnight (e.g. $18 \times 60 + 30 = 1110$ minutes) to allow numeric comparison.
3. For each existing booking $[T_{\text{existStart}}, T_{\text{existEnd}}]$ on the table, a conflict is detected if:
   $$T_{\text{reqStart}} < T_{\text{existEnd}} + 15 \quad \text{AND} \quad T_{\text{existStart}} < T_{\text{reqEnd}} + 15$$
   If this inequality holds true for any booking, a conflict exists, and the table is deemed unavailable.

### 3. Double-Booking Race Condition Prevention
To prevent two customers from booking the exact same table/slot simultaneously:
- When checking availability (the `/available-tables` API endpoint), the available tables are listed.
- When saving a booking (the `POST /` API endpoint), the controller **re-executes** the exact same conflict check inside a database read block before calling `save()`. If a conflicting booking was saved in the split-second between search and confirmation, the request is rejected with a conflict error.

---

## Explanation of Role-Based Access (User vs Admin)

The system enforces role-based access control (RBAC) at both the API level (backend) and the visual interface level (frontend).

### 1. Backend Role Enforcement
Every user document in MongoDB contains a `role` field, which can be either `'customer'` (default) or `'admin'`.
Authentication and access control are handled via two middlewares in `backend/middleware/auth.js`:
- **`auth` Middleware**: Intercepts request headers, extracts the JWT bearer token, verifies it, extracts the user ID, queries the database to retrieve the user's details (excluding password), and attaches the user object to `req.user`.
- **`admin` Middleware**: Runs after `auth` and checks if `req.user.role === 'admin'`. If not, it blocks the request immediately with a `403 Forbidden` response.

#### Route Permissions Matrix
| Endpoint | HTTP Method | Middleware | Allowed Roles | Description |
| :--- | :---: | :--- | :---: | :--- |
| `/api/auth/register` | `POST` | None | Anyone | Create customer profile |
| `/api/auth/login` | `POST` | None | Anyone | User authentication (returns JWT) |
| `/api/reservations/available-tables` | `GET` | `auth` | Customer / Admin | Check available tables |
| `/api/reservations` | `POST` | `auth` | Customer / Admin | Book a table |
| `/api/reservations` | `GET` | `auth` | Customer / Admin | View own reservations |
| `/api/reservations/:id` | `DELETE` | `auth` | Customer / Admin | Cancel reservation (Customers can only cancel their own; admins can cancel any) |
| `/api/reservations/all` | `GET` | `auth` + `admin` | Admin | View all bookings across the system |
| `/api/reservations/:id` | `PUT` | `auth` + `admin` | Admin | Edit date, time, table, guest count, or status of any booking |
| `/api/tables` | `GET` | `auth` | Customer / Admin | Get list of all tables |
| `/api/tables` | `POST` | `auth` + `admin` | Admin | Add a new table to the system |
| `/api/tables/:id` | `DELETE` | `auth` + `admin` | Admin | Remove a table from the system |

### 2. Frontend Interface Separation
- The frontend decodes the role from the token received upon login.
- Depending on the role, the application loads different dashboards:
  - **Customer Panel**: Focuses on booking creation, table cards selection, and personal booking history.
  - **Admin Panel**: Styled distinctively with warning accents and dark admin metrics. It exposes a single master list of all bookings with date filters, reservation editing modals, and table configuration widgets (Add/Delete tables).

---

## Known Limitations

1. **Fixed Time & Operating Parameters**: The business hours (`11:00` - `23:00`) and the `15`-minute buffer are hardcoded. Changing them requires editing the source code directly.
2. **No Crossing Midnight**: Customers cannot reserve a table for late-night slots that cross the midnight line (e.g. 11:30 PM to 12:30 AM).
3. **No Customer Self-Edit**: Customers cannot reschedule or change guest counts for existing bookings. They must cancel the booking and create a new reservation.
4. **No Split/Join Table Layouts**: The system handles tables as discrete blocks. It cannot merge adjacent smaller tables (e.g. two 2-person tables) to seat a larger party (e.g. 4 people) even if they are available at the same time.

---

## Areas for Improvement (With Additional Time)

1. **Dynamic Configuration Manager**: Build an admin settings table in the database and a UI panel to configure operating hours, buffer intervals, and specific holiday closures dynamically.
2. **Automated Notification Engine**: Integrate an email service (like Nodemailer or SendGrid) to send automated booking confirmations, updates, and cancellation receipts to customers.
3. **Interactive Table Map**: Develop a visual canvas editor showing the spatial layout of tables, allowing customers to choose tables visually and admins to arrange the dining room map.
4. **Smart Table Combinations**: Implement a scheduling optimizer that can split and join table configurations automatically to maximize capacity utilization (e.g., combining Table 1 and Table 2 for a party of 4 if no 4-person table is free).
5. **Additional Roles**: Introduce intermediate roles such as `'staff'` or `'hostess'` who can view and manage bookings but cannot delete tables or alter system configurations.
6. **Comprehensive Automated Testing**: Add backend integration tests using Supertest/Jest and frontend component tests using Jest/React Testing Library to fully cover reservation conflict scenarios and role validation middleware.
