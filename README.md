# GT-Referrals
Repository holding the code for GT-Referrals

# Getting Started (New User Setup)
Follow these steps to initialize the MERN stack environment on your local machine.

## 1. Prerequisites
### Node.js: Version 18.x or higher.

### npm: Installed with Node.

### MongoDB: A local instance or a MongoDB Atlas connection string.

## 2. Installation
Clone the repository and install the dependencies for the root, the backend server, and the frontend client.

```Bash
# Clone the repository
git clone <your-repository-link>
cd gt-referrals
```
# Install root dependencies (for running concurrent scripts)
`npm install`

# Install backend dependencies
`cd server && npm install`

# Install frontend dependencies
`cd ../client && npm install`

## 3. Configuration
Create a .env file inside the /server directory to hold your environment variables:

Code snippet
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
```
## 4. Running the App
From the root directory, run the following command to start both the Vite frontend and the Node backend simultaneously:

Bash
```
npm run dev
```
Frontend: http://localhost:5173

Backend: http://localhost:5000

Phase 1 - Planning
We are currently focusing on designing out the frontend as well as some of the backend/database architecture to make implementation easy later on.
