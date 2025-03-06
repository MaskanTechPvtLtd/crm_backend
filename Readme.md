# CRM Backend

## Introduction
This is the backend system for the CRM (Customer Relationship Management) application. It is built using **Node.js**, **Express.js**,**Sequelize**, **PostgreSQL**, and includes additional features such as **Redis caching**, **rate limiting**, **data validation**, and **logging** with Winston.

## HTTP Status Codes
The application follows standard HTTP response status codes:

### **1xx - Informational Responses**
- **100 Continue** – Initial part of the request received, client should continue.
- **102 Processing** – Server is still processing the request.

### **2xx - Successful Responses**
- **200 OK** – Request succeeded.
- **201 Created** – Resource successfully created.
- **202 Accepted** – Request accepted but processing is not yet completed.

### **3xx - Redirection Responses**
- **307 Temporary Redirect** – Resource temporarily moved, same request method should be used.
- **308 Permanent Redirect** – Resource permanently moved, same request method should be used.

### **4xx - Client Errors**
- **400 Bad Request** – Invalid request from client.
- **401 Unauthorized** – Authentication required.
- **402 Payment Required** – Reserved for future use.
- **404 Not Found** – Resource not found.

### **5xx - Server Errors**
- **500 Internal Server Error** – Generic server error.
- **504 Gateway Timeout** – Server did not receive a timely response.

## Installation and Setup

### **Step 1: Install Dependencies**
Run the following command to install all required dependencies:
```sh
npm install
```

### **Step 2: Install and Use Nodemon**
For automatic server restart during development, install **nodemon**:
```sh
npm install -g nodemon
```
Run the project:
```sh
npm run dev
```

## Upload and Read Excel Files
To handle Excel file uploads and parsing, use the provided middleware. Example usage:
```js
app.post('/upload', uploadMiddleware, (req, res) => {
    // Process uploaded Excel file
});
```

## Setting Up Redis on Windows
Follow these steps to install and configure **Redis** on Windows:

### **Step 1: Install WSL (Windows Subsystem for Linux)**
```sh
wsl --install
```
After installation, **reboot your system**.

### **Step 2: Install Redis**
```sh
sudo apt update
sudo apt upgrade
sudo apt install redis-server
sudo service redis-server start
```

### **Step 3: Verify Redis Installation**
```sh
redis-cli ping
```
If Redis is running, it should return:
```
PONG
```

### **Step 4: Start Redis Service**
```sh
sudo systemctl start redis
```

### **Step 5: Connect to Redis in Node.js**
Get the WSL IP Address:
```sh
ip addr | grep inet
```
Example output:
```
inet 172.22.96.1/20 brd 172.22.111.255 scope global eth0
```
Use this IP to connect Redis in your **Node.js** application.

## Key Features

### **1. Logging with Winston**
**Winston** is used for structured logging in production. It captures logs at different levels (info, error, warning) and stores them for monitoring and debugging.

### **2. API Rate Limiting**
Rate limiting is implemented to prevent excessive API requests and ensure fair usage.

### **3. Data Validation and Sanitization**
We use **express-validator** for input validation and sanitization to prevent bad data and security vulnerabilities.

## Middleware for Query Parameter Validation
This middleware ensures that query parameters are valid and sanitized before being processed:

```js
const { query, validationResult } = require('express-validator');

const validateQueryParams = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer greater than 0')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be an integer between 1 and 100')
        .toInt(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

module.exports = validateQueryParams;
```

This middleware:
- Validates that `page` and `limit` are within acceptable ranges.
- Converts them to integers.
- Returns a **400 Bad Request** response if validation fails.
- Proceeds to the next middleware if validation succeeds.

---

## Conclusion
This **CRM backend** provides robust APIs with proper logging, rate limiting, Redis caching, and request validation. Follow the steps above to set up and run the application efficiently.

---
### **Author**
📌 Developed by [Maskan Technologies]  
📧 Contact: [maskan@info.com]

