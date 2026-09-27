STUDENT API MANAGER & HTTP ANALYZER
=========================================

Project Topic:
Develop a web application running on a local web server and analyze HTTP
requests, responses, headers, payload and status codes using browser developer tools.

FEATURES
--------
- RESTful HTTP Methods:
    GET    /api/students/<id>  -> Fetch student data by ID (Status: 200 OK or 404 Not Found)
    GET    /api/students       -> Fetch all students list (Status: 200 OK)
    POST   /api/students       -> Create a new student (Status: 201 Created or 400 Bad Request)
    PUT    /api/students/<id>  -> Update existing student (Status: 200 OK or 404 Not Found)
    DELETE /api/students/<id>  -> Delete student by ID (Status: 200 OK or 404 Not Found)
- Built-in Deep Inspector:
    * Status Code badge (200 OK, 201 Created, 404 Not Found, etc.)
    * Request Latency (ms)
    * Formatted JSON response viewer
    * Sent Request Payload inspector (for POST/PUT)
    * Request & Response HTTP Headers inspector
- Live Database Records Table with 1-click "Select" to auto-populate form.
- Teacher DevTools Viva & Demonstration Guide.

REQUIREMENTS
------------
- Python 3.8+ (Uses only standard library, zero external pip packages needed)
- Google Chrome, Microsoft Edge, Firefox, or Brave

HOW TO RUN
----------
1. Open PowerShell or Command Prompt in this folder:
   cd student_http_web_app

2. Run the server:
   python server.py

3. Open your browser and go to:
   http://localhost:8000

HOW TO DEMONSTRATE IN BROWSER DEVTOOLS (TEACHER EVALUATION)
-----------------------------------------------------------
1. Open http://localhost:8000 in Chrome or Edge.
2. Press F12 (or right-click anywhere -> Inspect -> Network tab).
3. Ensure the "Fetch/XHR" filter or "All" filter is selected in DevTools Network tab.

DEMO 1: GET (Fetch Student)
---------------------------
- Keep Student ID as 1.
- Click [ GET ].
- In DevTools Network tab, select the request "1":
  * Request URL: http://localhost:8000/api/students/1
  * Request Method: GET
  * Status Code: 200 OK
  * Headers: Content-Type: application/json; charset=utf-8
  * Response: Shows student JSON { "id": 1, "name": "Amit Sahu", "roll": "27", "course": "B.Tech" }

DEMO 2: POST (Add New Student)
------------------------------
- Enter Name: "Priya Sharma", Roll: "35", Course: "B.Tech IT"
- Click [ POST ].
- In DevTools Network tab, select the POST request "students":
  * Request URL: http://localhost:8000/api/students
  * Request Method: POST
  * Status Code: 201 Created
  * Payload / Request Body: {"name":"Priya Sharma","roll":"35","course":"B.Tech IT"}
  * Response: Returns the newly created student with its generated ID.

DEMO 3: PUT (Update Student)
----------------------------
- Select Student ID: 1.
- Change Course from "B.Tech" to "M.Tech".
- Click [ PUT ].
- In DevTools Network tab, select the PUT request "1":
  * Request URL: http://localhost:8000/api/students/1
  * Request Method: PUT
  * Status Code: 200 OK
  * Payload: Shows updated values.
  * Response: Confirms student updated.

DEMO 4: DELETE (Remove Student)
-------------------------------
- Enter the Student ID you want to remove.
- Click [ DELETE ].
- In DevTools Network tab, select the DELETE request:
  * Request URL: http://localhost:8000/api/students/<id>
  * Request Method: DELETE
  * Status Code: 200 OK (or 404 if ID does not exist)

DEMO 5: 404 Not Found (Error Handling)
--------------------------------------
- Click "Test 404 (Wrong URL)" or enter ID 9999 and click [ GET ].
- In DevTools Network tab, select the request:
  * Status Code: 404 Not Found (highlighted in red)
  * Response: JSON error object with message.

KEY HTTP STATUS CODES EXPLAINED
-------------------------------
- 200 OK           : The request succeeded (GET, PUT, DELETE).
- 201 Created      : A new resource was successfully created on the server (POST).
- 400 Bad Request  : The request had missing or invalid payload fields.
- 404 Not Found    : The requested resource/endpoint or student ID was not found.
