# Smart Bus Backend

A Node.js/Express backend for a smart bus booking system, supporting user registration, bus operators, admins, city/route management, bus schedules, seat locking, and bookings. Built with PostgreSQL (via Prisma ORM), Redis, and JWT authentication.

---

## Architecture Overview

![Flow Diagram](#)

<details>
<summary>Click to expand flow diagram</summary>

```
graph TD
    A[User] -->|Registers/Login| B(Auth API)
    B -->|Receives JWT| A
    A -->|Accesses| C(Cities API)
    A -->|Accesses| D(Routes API)
    A -->|Accesses| E(Buses API)
    A -->|Accesses| F(Bus Schedules API)
    A -->|Accesses| G(Bookings API)
    A -->|Admin/Operator| H(Admin API)
    C -->|CRUD| I[City DB]
    D -->|CRUD| J[Route DB]
    E -->|CRUD| K[Bus DB]
    F -->|CRUD| L[BusSchedule DB]
    G -->|CRUD| M[Booking DB]
    H -->|Manage Users/Operators| N[User/Operator DB]
    G -->|Lock/Book Seats| O[Redis]
    G -->|Payment| P[Payment Service]
    subgraph Database
      I
      J
      K
      L
      M
      N
    end
```

</details>

---

## Main Features
- User registration/login with JWT
- Admin/operator/user roles
- City & state management
- Route management
- Bus & schedule management
- Seat locking (Redis)
- Booking & payment status
- Image upload (Cloudinary)

---

## API Endpoints

### Auth
- `POST /api/auth/register` — Register user
  - **Body:** `{ name, email, password }`
  - **Response:** `{ success, message, user }`
- `POST /api/auth/login` — Login user
  - **Body:** `{ email, password }`
  - **Response:** `{ success, accessToken, user }`

### Cities
- `GET /api/cities/` — List cities
- `POST /api/cities/add` — Add city (ADMIN)
- `DELETE /api/cities/remove/:id` — Remove city (ADMIN)
- `PATCH /api/cities/:id/image` — Upload city image (ADMIN)
- `GET /api/cities/states` — List states
- `POST /api/cities/states/add` — Add state (ADMIN)

**Example Response:**
```json
{
  "success": true,
  "message": "Cities fetched successfully.",
  "cities": [
    { "id": 1, "name": "Delhi", ... }
  ]
}
```

### Routes
- `GET /api/routes/` — List routes
- `POST /api/routes/add` — Add route (OPERATOR/ADMIN)
- `GET /api/routes/search?cityAId=1&cityBId=2` — Search route

### Buses
- `GET /api/buses/` — List buses (OPERATOR/ADMIN)
- `POST /api/buses/add` — Add bus (OPERATOR/ADMIN)
- `POST /api/buses/remove/:id` — Remove bus (OPERATOR/ADMIN)

### Bus Schedules
- `GET /api/bus-schedules/` — List all schedules (OPERATOR/ADMIN)
- `GET /api/bus-schedules/bus/:busId` — Schedules for a bus
- `POST /api/bus-schedules/add` — Add schedule (OPERATOR/ADMIN)
- `GET /api/bus-schedules/search?...` — Search schedules (USER)

### Bookings
- `GET /api/bookings/` — List bookings (USER/OPERATOR/ADMIN)
- `GET /api/bookings/seat-plan/:scheduleId` — Get seat plan
- `POST /api/bookings/lock-seats` — Lock seats (USER)
- `POST /api/bookings/create` — Create booking (USER)

**Example Response:**
```json
{
  "success": true,
  "message": "Booking created successfully.",
  "booking": { "id": 123, ... }
}
```

### Admin
- `POST /api/admin/login` — Admin login
- `GET /api/admin/users` — List users (ADMIN)
- `DELETE /api/admin/users/:id` — Delete user (ADMIN)
- `POST /api/admin/users/add-admin` — Add admin (ADMIN)
- `POST /api/admin/operators/add` — Add operator (ADMIN)
- `DELETE /api/admin/operators/delete/:id` — Delete operator (ADMIN)
- `PATCH /api/admin/operators/:id/logo` — Upload operator logo (ADMIN)
- `PATCH /api/admin/users/:id/role` — Change user role (ADMIN)

---

## Database Schema
- See `prisma/schema.prisma` for full schema (Users, Operators, Cities, Routes, Buses, Schedules, Bookings, Payments, etc.)

---

## Tech Stack
- Node.js, Express.js
- PostgreSQL (Prisma ORM)
- Redis (seat locking)
- Cloudinary (image upload)
- JWT Auth
- Helmet, CORS, Morgan

---

## Getting Started
1. Clone repo & install dependencies
2. Set up `.env` with PostgreSQL, Redis, Cloudinary, JWT secrets
3. Run migrations: `npx prisma migrate deploy`
4. Start server: `node server.js`

---

## License
MIT
