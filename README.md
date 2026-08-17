# 🚀 RFQ British Auction System

A full-stack **RFQ (Request for Quotation) British auction platform** where suppliers competitively bid by submitting progressively lower quotations in real time.

The system focuses on **transaction-safe bid processing, concurrency handling, dynamic auction extensions, real-time synchronization, and auditable bidding history**.

In the auction, a buyer creates an RFQ with a defined bidding window and forced closing time. Suppliers submit quotations, and the system continuously tracks the **global lowest bid**. Valid bids, auction extensions, and activity logs are processed atomically using MongoDB transactions and synchronized across connected clients using Socket.IO.
---

## ✨ Features

### 🔐 Authentication & Authorization

- JWT-based authentication
- Role-based access control
- Separate Buyer and Supplier roles
- Buyers can create RFQs
- Suppliers can participate in auctions and submit bids

### 📦 RFQ Management

- Create RFQs with:
  - RFQ name
  - Unique reference ID
  - Pickup date
  - Bid start time
  - Initial bid close time
  - Forced close time
- Dynamic `currentBidCloseTime` for auction extensions

### 💰 Competitive Bidding

Suppliers submit quotations containing:

- Carrier name
- Freight charges
- Origin charges
- Destination charges
- Transit time
- Quote validity

The total bid amount is calculated automatically:

```text
Total Bid Amount =
Freight Charges
+ Origin Charges
+ Destination Charges

A bid is accepted only when its total amount is lower than the current global lowest bid.

### 🏆 Global Lowest Bid Tracking

The RFQ maintains the current lowest bid for efficient access:

```text
currentLowestBidId
currentLowestBidAmount
currentLowestSupplier
```

### ⏱️ Dynamic Auction Extension

Auctions support a configurable trigger window and extension duration.

When a qualifying bid arrives near the closing time, the auction can be automatically extended.

The extended closing time can never exceed the configured forced closing time.

### ⚡ Real-Time Auction Updates

Socket.IO provides real-time synchronization between clients viewing the same RFQ.

Connected clients receive updates for:

New accepted bids
Current lowest bid
Updated auction close time
Activity events

Each RFQ uses a dedicated Socket.IO room:

auction:<rfqId>

### ⏱️ Live Auction Countdown

The frontend displays a live countdown based on the server-provided currentBidCloseTime.

The countdown runs locally in the browser, while Socket.IO updates the deadline whenever the auction is extended.

### 📝 Activity Logging

Important auction events are persisted for auditability, including:

bid_submitted
time_extended
auction_closed

### 🔒 Transaction-Safe Bid Processing

Bid submission is processed inside a MongoDB transaction.

The following operations are handled atomically:

Create Bid
     +
Update Current Lowest Bid
     +
Apply Auction Extension
     +
Create Activity Logs

If any operation fails, the transaction is rolled back.

---

## 🧠 Architecture

The application follows a modular full-stack architecture with REST APIs for request/command operations and Socket.IO for real-time auction state synchronization.

```text
                         React Frontend
                              │
                ┌─────────────┴─────────────┐
                │                           │
             REST API                   Socket.IO
                │                           │
                ▼                           ▼
          Express.js Backend          Auction Rooms
                │                           │
                ▼                           │
          Service Layer                     │
                │                           │
                ▼                           │
          Auction Engine ◄─────────────────┘
                │
                ▼
       MongoDB + Mongoose
                │
        ┌───────┼────────┐
        ▼       ▼        ▼
       RFQ     Bids   Activity Logs
```

### 🔄 Request & Real-Time Flow

REST APIs handle operations such as:

POST /rfqs
POST /bids
GET /rfqs
GET /rfqs/:id/details

Socket.IO handles real-time updates after successful auction operations:

```text
Bid Submission
      ↓
Auction Engine
      ↓
MongoDB Transaction
      ↓
Transaction Commit
      ↓
Socket.IO Event
      ↓
RFQ-specific Room
      ↓
Connected Clients
```

Each RFQ has its own Socket.IO room:

auction:<rfqId>

This ensures that auction updates are delivered only to clients participating in or viewing that specific RFQ.       

## 🧠 System Design

The auction system separates HTTP request handling, business logic, transaction management, and real-time communication.

### 🔄 Bid Processing Flow

```text
Supplier submits bid
        │
        ▼
Bid Validation
        │
        ├── Role validation
        ├── Required field validation
        ├── Charge validation
        ├── Total amount calculation
        └── Auction time validation
        │
        ▼
Auction Engine
        │
        ▼
Start MongoDB Transaction
        │
        ▼
Fetch RFQ + Auction Configuration
        │
        ▼
Validate Current Auction State
        │
        ▼
Compare with Current Lowest Bid
        │
        ├───────────────┐
        │               │
      Invalid          Valid
        │               │
      Reject            ▼
                    Create Bid
                        │
                        ▼
               Update Current Lowest
                        │
                        ▼
                Check Trigger Window
                        │
                   ┌────┴────┐
                   │         │
                  No        Yes
                   │         │
                   │         ▼
                   │   Extend Auction
                   │         │
                   └────┬────┘
                        ▼
                Create Activity Logs
                        │
                        ▼
                    Save RFQ
                        │
                        ▼
                     COMMIT
                        │
                        ▼
                 Socket.IO Event
                        │
                        ▼
              Connected RFQ Clients
```
If any operation fails, the transaction is aborted and the database changes are rolled back.

### ⚡ Real-Time State Synchronization

After the transaction successfully commits, the backend emits a BID_ACCEPTED Socket.IO event to the corresponding RFQ room.

The event contains the updated auction state, allowing connected clients to update:

Current lowest bid
Current lowest supplier
Bid history
Activity logs
Auction close time
Countdown timer

The WebSocket event is emitted only after successful transaction completion, preventing clients from receiving updates for failed or rolled-back bids.

---

## 🧠 Design Decisions

- **Global Lowest Bid:** Track only the current lowest bid in the RFQ instead of recalculating ranks for every bid. Historical bids remain stored separately.

- **MongoDB Transactions:** Bid creation, lowest-bid updates, auction extensions, and activity logs are processed atomically.

- **REST + Socket.IO:** REST handles API operations, while Socket.IO pushes real-time auction updates to connected clients.

- **RFQ-Specific Rooms:** Each auction has a dedicated Socket.IO room (`auction:<rfqId>`) so updates are sent only to relevant clients.

- **Server as Source of Truth:** Bid validation, auction timing, lowest bid, and extension rules are enforced on the backend.

- **Dynamic Closing Time:** `currentBidCloseTime` can be extended but can never exceed `forcedBidCloseTime`.

- **Append-Only Bid History:** Every accepted bid is preserved for history and auditability.
---

## 🗄️ Database Schema

### RFQ

Stores the auction configuration and current auction state.

```text
RFQ
├── name
├── referenceId
├── buyerId
├── pickupDate
├── bidStartTime
├── bidCloseTime
├── currentBidCloseTime
├── forcedBidCloseTime
├── currentLowestBidId
├── currentLowestBidAmount
└── currentLowestSupplier
```
---
### Bid

Stores each supplier quotation as a separate historical record.

```text
Bid
├── rfqId
├── supplierId
├── carrierName
├── freightCharges
├── originCharges
├── destinationCharges
├── totalBidAmount
├── transitTime
└── validityOfQuote
```
### AuctionConfig

Stores configurable auction extension rules.
```text
AuctionConfig
├── rfqId
├── triggerWindowMinutes
└── extensionDurationMinutes
```

### ActivityLog

Stores auction events for auditability.
```text
ActivityLog
├── rfqId
├── eventType
├── supplierId
├── bidId
├── message
├── reason
├── previousCloseTime
└── newCloseTime
```

---

## ⚙️ Tech Stack

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Socket.IO

### Frontend

- React
- Vite
- React Router
- Fetch API

### Core Concepts

- REST APIs
- WebSockets
- Socket.IO Rooms
- MongoDB Transactions
- Concurrency Control
- Role-Based Access Control
- Event-Driven Architecture
- Audit Logging

---

## 📁 Project Structure

```text
root/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── rfq/
│   │   │   ├── bid/
│   │   │   ├── auction/
│   │   │   └── activity/
│   │   ├── middlewares/
│   │   ├── config/
│   │   ├── socket/
│   │   └── utils/
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── utils/
│   │   └── socket.js
│   └── package.json
│
├── images/
├── .gitignore
└── README.md
```

---

## 🚀 Setup Instructions

### 1️⃣ Clone Repository

```bash
git clone https://github.com/subhrat123/rfq-british-auction-system
cd rfq-british-auction-system
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
```

Run backend:

```bash
npm run dev
```

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/signup` | Register a user |
| POST | `/api/v1/auth/login` | Authenticate a user |

### RFQ

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/rfqs` | Create an RFQ |
| GET | `/api/v1/rfqs` | Get all RFQs |
| GET | `/api/v1/rfqs/:id/details` | Get RFQ details, bids, logs, and configuration |

### Auction Configuration

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auction-config` | Configure auction extension rules |

### Bids

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/bids` | Submit a supplier bid |

### Activity Logs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/activity/:rfqId` | Get activity logs for an RFQ |

---

## ⚡ Real-Time Events

The application uses Socket.IO to synchronize auction state across connected clients.

### Client → Server

| Event | Description |
|---|---|
| `join_auction` | Join an RFQ-specific auction room |
| `leave_auction` | Leave an RFQ-specific auction room |

### Server → Client

| Event | Description |
|---|---|
| `BID_ACCEPTED` | Broadcast after a bid is successfully committed |

The `BID_ACCEPTED` event contains the updated auction information, including:

- Accepted bid
- Current lowest bid
- Current lowest supplier
- Current bid close time
- Activity events

Each RFQ uses a dedicated Socket.IO room:

```text
auction:<rfqId>
```

---

## 🧪 Testing Flow

1. Sign up and log in as a **Buyer**.
2. Create an RFQ with bidding and forced-close times.
3. Configure the auction trigger window and extension duration.
4. Sign up and log in as a **Supplier**.
5. Open the same RFQ in multiple browser sessions.
6. Submit valid bids and verify:
   - Current lowest bid updates
   - Bid history updates
   - Activity logs update
   - Connected clients receive updates in real time
7. Submit a bid during the trigger window and verify that the auction close time is extended.
8. Submit an invalid bid and verify that it is rejected.

---

## ⚠️ Validations & Error Handling

- Role-based access control for Buyers and Suppliers
- Required field validation
- Non-negative charge validation
- Numeric bid amount validation
- RFQ start, close, and forced-close time validation
- Bid submission allowed only during the active auction window
- New bid must be lower than the current global lowest bid
- Auction extensions cannot exceed the forced close time
- Only one auction configuration is allowed per RFQ
- MongoDB transaction rollback on failed auction operations
- Appropriate HTTP status codes and error messages for failed requests

---

## 💡 Key Engineering Highlights

- **Transaction-Safe Auction Engine** — Atomically processes bid creation, lowest-bid updates, auction extensions, and activity logging.

- **Concurrency-Aware Bid Processing** — Uses MongoDB transactions to maintain consistency when multiple bids are submitted concurrently.

- **Real-Time Synchronization** — Socket.IO rooms push accepted bid and auction updates to connected clients without polling.

- **Dynamic Auction Extension** — Trigger-window logic extends the auction while respecting the forced-close boundary.

- **Optimized Auction State** — Maintains the global lowest bid directly on the RFQ while preserving complete bid history.

- **Audit Trail** — Records bid submissions and auction extensions through persistent activity logs.

---


## 🔮 Future Improvements

- Auction winner notification after closing
- Pagination and filtering for large bid histories
- Automated concurrency and integration tests
- Production-grade background job scheduling
- Redis adapter for Socket.IO horizontal scaling
- Improved responsive UI/UX
- Deployment with monitoring and centralized logging

---

## 👨‍💻 Author

**Subhrat Verma**

Built as a full-stack project to explore **auction systems, transactional database operations, concurrency handling, and real-time web applications**.

---
