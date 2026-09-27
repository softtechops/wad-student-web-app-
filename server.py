from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
import re

HOST = "127.0.0.1"
PORT = 8000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, "public")

# Initial student records
students = [
    {"id": 1, "name": "Amit Sahu", "roll": "27", "course": "B.Tech"},
    {"id": 2, "name": "Amar Singh", "roll": "04", "course": "B.Tech"},
    {"id": 3, "name": "Shreehari Shukla", "roll": "23", "course": "B.Tech"}
]

class Handler(BaseHTTPRequestHandler):
    server_version = "StudentHTTPServer/1.0"

    def _set_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def send_json(self, status, data):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        # 1. GET /api/students -> Return all students
        if self.path == "/api/students":
            self.send_json(200, students)
            return

        # 2. GET /api/students/<id> -> Return single student by ID
        match = re.match(r"^/api/students/(\d+)$", self.path)
        if match:
            student_id = int(match.group(1))
            student = next((s for s in students if s["id"] == student_id), None)
            if student:
                self.send_json(200, student)
            else:
                self.send_json(404, {
                    "error": "Student not found",
                    "id": student_id,
                    "message": f"Student with ID {student_id} does not exist"
                })
            return

        # 3. GET /api/status -> Server health check
        if self.path == "/api/status":
            self.send_json(200, {
                "message": "Student HTTP Server is running healthy",
                "method": "GET",
                "status": 200,
                "total_students": len(students)
            })
            return

        # 4. Static file serving (HTML, CSS, JS)
        req_path = self.path
        if req_path == "/":
            req_path = "/index.html"

        # Strip query parameters if any
        req_path = req_path.split("?")[0]
        safe_path = os.path.normpath(req_path.lstrip("/"))
        file_path = os.path.join(PUBLIC_DIR, safe_path)

        if os.path.isfile(file_path) and os.path.commonpath([PUBLIC_DIR, file_path]) == PUBLIC_DIR:
            content_type = "text/html; charset=utf-8"
            if file_path.endswith(".css"):
                content_type = "text/css; charset=utf-8"
            elif file_path.endswith(".js"):
                content_type = "application/javascript; charset=utf-8"
            elif file_path.endswith(".png"):
                content_type = "image/png"
            elif file_path.endswith(".ico"):
                content_type = "image/x-icon"

            with open(file_path, "rb") as f:
                body = f.read()

            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        # 404 for unknown endpoints
        self.send_json(404, {
            "error": "Endpoint or resource not found",
            "path": self.path,
            "status": 404
        })

    def do_HEAD(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self._set_cors_headers()
        self.end_headers()

    def do_POST(self):
        # POST /api/students -> Add new student
        if self.path != "/api/students":
            self.send_json(404, {
                "error": "POST endpoint not found",
                "path": self.path,
                "hint": "POST should be sent to /api/students"
            })
            return

        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length)

        try:
            data = json.loads(raw.decode("utf-8"))
            name = str(data.get("name", "")).strip()
            roll = str(data.get("roll", "")).strip()
            course = str(data.get("course", "")).strip()

            if not name or not roll or not course:
                self.send_json(400, {
                    "error": "Bad Request",
                    "message": "All fields ('name', 'roll', 'course') are required",
                    "status": 400
                })
                return

            new_id = (max([s["id"] for s in students]) + 1) if students else 1
            new_student = {
                "id": new_id,
                "name": name,
                "roll": roll,
                "course": course
            }
            students.append(new_student)
            self.send_json(201, {
                "message": "Student created successfully",
                "student": new_student,
                "status": 201
            })

        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_json(400, {
                "error": "Bad Request",
                "message": "Invalid JSON payload sent in request body",
                "status": 400
            })

    def do_PUT(self):
        # PUT /api/students/<id> -> Update student by ID
        match = re.match(r"^/api/students/(\d+)$", self.path)
        if not match:
            self.send_json(404, {
                "error": "PUT endpoint not found",
                "path": self.path,
                "hint": "PUT should be sent to /api/students/<id> (e.g. /api/students/1)"
            })
            return

        student_id = int(match.group(1))
        student = next((s for s in students if s["id"] == student_id), None)

        if not student:
            self.send_json(404, {
                "error": "Student not found",
                "id": student_id,
                "message": f"Cannot update: Student with ID {student_id} does not exist",
                "status": 404
            })
            return

        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length)

        try:
            data = json.loads(raw.decode("utf-8"))
            name = str(data.get("name", "")).strip()
            roll = str(data.get("roll", "")).strip()
            course = str(data.get("course", "")).strip()

            if not name or not roll or not course:
                self.send_json(400, {
                    "error": "Bad Request",
                    "message": "All fields ('name', 'roll', 'course') are required for update",
                    "status": 400
                })
                return

            student["name"] = name
            student["roll"] = roll
            student["course"] = course

            self.send_json(200, {
                "message": f"Student with ID {student_id} updated successfully",
                "student": student,
                "status": 200
            })

        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_json(400, {
                "error": "Bad Request",
                "message": "Invalid JSON payload in PUT body",
                "status": 400
            })

    def do_DELETE(self):
        # DELETE /api/students/<id> -> Delete student by ID
        match = re.match(r"^/api/students/(\d+)$", self.path)
        if not match:
            self.send_json(404, {
                "error": "DELETE endpoint not found",
                "path": self.path,
                "hint": "DELETE should be sent to /api/students/<id> (e.g. /api/students/1)"
            })
            return

        student_id = int(match.group(1))
        student = next((s for s in students if s["id"] == student_id), None)

        if not student:
            self.send_json(404, {
                "error": "Student not found",
                "id": student_id,
                "message": f"Cannot delete: Student with ID {student_id} does not exist",
                "status": 404
            })
            return

        students.remove(student)
        self.send_json(200, {
            "message": f"Student with ID {student_id} deleted successfully",
            "deleted_student": student,
            "status": 200
        })

if __name__ == "__main__":
    print(f"==================================================")
    print(f" Student HTTP API Server running on port {PORT}")
    print(f" Web Interface: http://localhost:{PORT}")
    print(f" API Endpoints:")
    print(f"   GET    /api/students")
    print(f"   GET    /api/students/<id>")
    print(f"   POST   /api/students")
    print(f"   PUT    /api/students/<id>")
    print(f"   DELETE /api/students/<id>")
    print(f"   GET    /api/status")
    print(f" Press Ctrl+C to stop.")
    print(f"==================================================")
    HTTPServer((HOST, PORT), Handler).serve_forever()
