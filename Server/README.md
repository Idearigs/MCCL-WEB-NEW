# McCulloch Website Server

This is the server component for the McCulloch Jewellery Website. It provides API endpoints to support the client-side functionality.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the Server directory
3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file based on the `.env.example` template

### Running the Server

For development:

```bash
npm run dev
```

For production:

```bash
npm start
```

## API Endpoints

### Health Check

- **GET** `/api/health`
  - Returns the status of the server

### Products

- **GET** `/api/products`
  - Returns a list of jewelry products

## Deployment

In production mode, the server will also serve the static files from the client build directory.

## Integration with Client

The client application is configured to communicate with this server for data retrieval and other operations.
