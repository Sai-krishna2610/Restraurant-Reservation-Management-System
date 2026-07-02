# Bistro Reservation Management System

A full-stack web application designed for restaurant managers to control table bookings and for customers to reserve tables at custom times.

## Project Overview

This repository contains the Bistro Reservation Management System. It allows customers to register, check table availability for specific dates and custom time ranges (e.g., 18:30 to 20:00), select their preferred table, and confirm reservations. The backend enforces seating capacity restrictions and a minimum 15-minute buffer between bookings on the same table. It also features a fully-fledged administrative dashboard for managers to oversee all reservations, filter bookings by date, modify reservation details, and add or delete tables.

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

## Database Schema & Logic

### 1. Data Models
- **User**: Stores username, unique email, hashed password, and role (`customer` or `admin`).
- **Table**: Stores unique table numbers and seating capacities.
- **Reservation**: Stores user reference, table reference, date (`YYYY-MM-DD`), `startTime` (`HH:MM`), `endTime` (`HH:MM`), guests count, and status (`booked` or `cancelled`).

### 2. Time Conflict and Buffer Algorithm
To prevent double bookings and maintain operations, the system enforces a **15-minute buffer** between consecutive reservations on any single table.

When checking availability for a requested time interval `[reqStart, reqEnd]` on a selected date:
1. All active bookings (`status: 'booked'`) for that date are retrieved.
2. Times are normalized to minutes from midnight (e.g., `18:30` becomes `1110` minutes).
3. For each table, the system checks for overlaps or buffer violations against existing bookings on that table. A conflict exists if:
   `reqStart < existEnd + 15 && existStart < reqEnd + 15`
4. If this condition is met for any booking, the table is marked unavailable for that period.

---

## Setup & Running Locally

### Prerequisites
- Node.js installed on your machine.
- MongoDB running locally (default: `mongodb://127.0.0.1:27017/restaurant-reservation`), OR you can start the backend without a running MongoDB daemon—it will automatically detect the absence of MongoDB and launch a dynamic **in-memory database fallback** for seamless testing.

### Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env` (a default `.env` file is already created for you with fallback settings).
4. Start the server:
   ```bash
   npm run dev
   ```
   *The backend will boot on port `5001` and automatically seed initial tables and test accounts.*

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

---

## Pre-seeded Credentials

To make testing easier, the system automatically seeds the following credentials on its first startup:

### 1. Administrator Account
- **Email**: `admin@restaurant.com`
- **Password**: `adminpassword`

### 2. Test Customer Account
- **Email**: `customer@restaurant.com`
- **Password**: `customerpassword`

---

## Assumptions & Limitations
- **Operating Hours**: The restaurant is assumed to operate between `11:00` and `23:00`. Bookings outside these hours are rejected.
- **Single-Day Bookings**: Bookings are restricted to the same calendar day (cannot cross midnight).
- **Buffer Rigidity**: The 15-minute buffer is hardcoded into the scheduling checks.
