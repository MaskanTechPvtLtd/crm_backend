1. Informational response (100 - 199)
2. succesful response (200-299)
3. Redirectional respone (300-399)
4. client error (400-499)
5. server error response(500-599)

<!--  
    Add winstom , rate limiter
    100 continue
    102 processing
    200 ok
    201 created
    202 accepted
    307 temporary redirect
    308 permenant redirect 


    400 bad request 
    401 unauthorized
    401 payment required
    404 not found
    500 internal server error
    504 gateway timeout
 -->"# crm_backend"

To run the project
use npm install
and install nodemon
npm run dev

and to read and upload the excel file use the middleware and below is the example

# Crm_BE

# Setup redis in your windows system using below command

1. wsl --install
   After installing the wsl reboot your system

2. sudo apt update
3. sudo apt upgrade
4. sudo apt install redis-server
5. sudo service redis-server start
6. redis-cli ping
7. If Redis is running, you should receive:
sudo systemctl start redis

PONG

Step 3: Access Redis from Windows Applications
Get the WSL IP Address:

ip addr | grep inet
You should see something like this:inet 172.22.96.1/20 brd 172.22.111.255 scope global eth0

Step 4: Connect to Redis in Your Node.js App
<!-- 
    winston for as production logger
    rate-limiter to limiting the hit of api
    data sanitization 
    express-validator
 -->



 
/**
 * Middleware to validate and sanitize query parameters for the API.
 *
 * Validates the following query parameters:
 * - 'page': Ensures it is a positive integer greater than 0.
 * - 'limit': Ensures it is an integer between 1 and 100.
 *
 * Sanitizes inputs by:
 * - Trimming whitespace.
 * - Converting valid inputs to integers.
 *
 * On validation failure:
 * - Returns a 400 Bad Request response with structured error details.
 *
 * On success:
 * - Proceeds to the next middleware or route handler with sanitized query parameters.
 */