// ==========================================================================
// Student API Manager - Client Logic & HTTP Inspector
// ==========================================================================

const API_BASE = window.location.origin;

// Form Elements
const inputId = document.getElementById("studentId");
const inputName = document.getElementById("studentName");
const inputRoll = document.getElementById("studentRoll");
const inputCourse = document.getElementById("studentCourse");
const endpointPreview = document.getElementById("currentEndpointPreview");
const nextIdBtn = document.getElementById("nextIdBtn");

// HTTP Action Buttons
const btnGet = document.getElementById("btnGet");
const btnPost = document.getElementById("btnPost");
const btnPut = document.getElementById("btnPut");
const btnDelete = document.getElementById("btnDelete");
const btnGetAll = document.getElementById("btnGetAll");
const btnTest404 = document.getElementById("btnTest404");
const btnClearForm = document.getElementById("btnClearForm");

// Inspector & Meta Elements
const responseStatusBadge = document.getElementById("responseStatusBadge");
const responseMethodPill = document.getElementById("responseMethodPill");
const responseTimeBadge = document.getElementById("responseTimeBadge");
const responseJsonDisplay = document.getElementById("responseJsonDisplay");
const requestPayloadDisplay = document.getElementById("requestPayloadDisplay");
const requestHeadersDisplay = document.getElementById("requestHeadersDisplay");
const responseHeadersDisplay = document.getElementById("responseHeadersDisplay");
const copyJsonBtn = document.getElementById("copyJsonBtn");

// Table Elements
const studentsTableBody = document.getElementById("studentsTableBody");
const refreshTableBtn = document.getElementById("refreshTableBtn");

// Server Health Elements
const serverStatusText = document.getElementById("serverStatusText");
const serverHealthBadge = document.getElementById("serverHealthBadge");

// Tabs
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

let lastResponseData = null;
let currentStudentList = [];

// ==========================================================================
// Helper Functions
// ==========================================================================

function updateEndpointHint() {
  const id = inputId.value.trim();
  if (id) {
    endpointPreview.innerHTML = `Target: <code>${API_BASE}/api/students/${id}</code>`;
  } else {
    endpointPreview.innerHTML = `Target: <code>${API_BASE}/api/students</code>`;
  }
}

inputId.addEventListener("input", updateEndpointHint);

// Tab switching
tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));

    btn.classList.add("active");
    const targetId = btn.getAttribute("data-tab");
    const targetEl = document.getElementById(targetId);
    if (targetEl) targetEl.classList.add("active");
  });
});

// Update Status Pill
function updateStatusBadge(status, statusText) {
  responseStatusBadge.className = "status-pill";
  responseStatusBadge.textContent = `${status} ${statusText}`;

  if (status >= 200 && status < 300) {
    responseStatusBadge.classList.add("status-2xx");
  } else if (status >= 400 && status < 500) {
    responseStatusBadge.classList.add("status-4xx");
  } else {
    responseStatusBadge.classList.add("status-5xx");
  }
}

// Update Method Pill
function updateMethodBadge(method) {
  responseMethodPill.style.display = "inline-block";
  responseMethodPill.className = `method-pill ${method}`;
  responseMethodPill.textContent = method;
}

// Display JSON
function displayJson(obj) {
  lastResponseData = obj;
  responseJsonDisplay.textContent = JSON.stringify(obj, null, 2);
}

// ==========================================================================
// Core Network Request Handler
// ==========================================================================
async function executeApiRequest(method, url, payload = null) {
  const startTime = performance.now();

  updateMethodBadge(method);
  responseTimeBadge.style.display = "inline-block";
  responseTimeBadge.textContent = "Requesting...";
  responseStatusBadge.className = "status-pill status-ready";
  responseStatusBadge.textContent = "Connecting...";

  // Record sent payload
  if (payload) {
    requestPayloadDisplay.textContent = JSON.stringify(payload, null, 2);
  } else {
    requestPayloadDisplay.textContent = `// None (${method} request has no payload body)`;
  }

  // Record outgoing request info
  requestHeadersDisplay.textContent = 
`Request Method : ${method}
Request URL    : ${API_BASE}${url}
Accept         : application/json
Content-Type   : ${payload ? "application/json" : "N/A"}`;

  try {
    const options = {
      method: method,
      headers: {}
    };

    if (payload) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(payload);
    }

    const res = await fetch(url, options);
    const duration = Math.round(performance.now() - startTime);

    responseTimeBadge.textContent = `${duration} ms`;
    updateStatusBadge(res.status, res.statusText || (res.status === 200 ? "OK" : res.status === 201 ? "Created" : ""));

    // Extract response headers
    let headerEntries = [];
    res.headers.forEach((val, key) => {
      headerEntries.push(`${key}: ${val}`);
    });
    if (headerEntries.length === 0) {
      // Fallback display
      responseHeadersDisplay.textContent = 
`Content-Type: ${res.headers.get("content-type") || "application/json; charset=utf-8"}
Status-Code: ${res.status}`;
    } else {
      responseHeadersDisplay.textContent = headerEntries.join("\n");
    }

    let data;
    try {
      data = await res.json();
    } catch {
      data = { rawResponse: await res.text() };
    }

    displayJson(data);
    return { ok: res.ok, status: res.status, data };

  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    responseTimeBadge.textContent = `${duration} ms`;
    responseStatusBadge.className = "status-pill status-4xx";
    responseStatusBadge.textContent = "Network Error";
    displayJson({
      error: "Network / Connection Error",
      message: err.message,
      hint: "Make sure the Python server is running (python server.py)"
    });
    return { ok: false, error: err };
  }
}

// ==========================================================================
// Button Actions
// ==========================================================================

// 1. GET /api/students/<id>
btnGet.addEventListener("click", async () => {
  const id = inputId.value.trim();
  if (!id) {
    alert("Please enter a Student ID to fetch, or use 'GET All' to view everyone.");
    inputId.focus();
    return;
  }

  const result = await executeApiRequest("GET", `/api/students/${id}`);
  if (result.ok && result.data && result.data.id) {
    // Auto populate the form for easy updating or inspection
    inputName.value = result.data.name || "";
    inputRoll.value = result.data.roll || "";
    inputCourse.value = result.data.course || "";
  }
});

// 2. POST /api/students
btnPost.addEventListener("click", async () => {
  const name = inputName.value.trim();
  const roll = inputRoll.value.trim();
  const course = inputCourse.value.trim();

  if (!name || !roll || !course) {
    alert("Please fill in Name, Roll Number, and Course to add a student.");
    return;
  }

  const payload = { name, roll, course };
  const result = await executeApiRequest("POST", `/api/students`, payload);

  if (result.ok && result.data && result.data.student) {
    // Set ID to the newly created student's ID
    inputId.value = result.data.student.id;
    updateEndpointHint();
    loadStudentsTable();
  }
});

// 3. PUT /api/students/<id>
btnPut.addEventListener("click", async () => {
  const id = inputId.value.trim();
  if (!id) {
    alert("Please enter a Student ID to update.");
    inputId.focus();
    return;
  }

  const name = inputName.value.trim();
  const roll = inputRoll.value.trim();
  const course = inputCourse.value.trim();

  if (!name || !roll || !course) {
    alert("Please fill in Name, Roll, and Course for updating.");
    return;
  }

  const payload = { name, roll, course };
  const result = await executeApiRequest("PUT", `/api/students/${id}`, payload);

  if (result.ok) {
    loadStudentsTable();
  }
});

// 4. DELETE /api/students/<id>
btnDelete.addEventListener("click", async () => {
  const id = inputId.value.trim();
  if (!id) {
    alert("Please enter a Student ID to delete.");
    inputId.focus();
    return;
  }

  const confirmDelete = confirm(`Are you sure you want to DELETE Student ID ${id}?`);
  if (!confirmDelete) return;

  const result = await executeApiRequest("DELETE", `/api/students/${id}`);
  if (result.ok) {
    loadStudentsTable();
  }
});

// 5. GET ALL
btnGetAll.addEventListener("click", async () => {
  await executeApiRequest("GET", `/api/students`);
  loadStudentsTable();
});

// 6. Test 404 (Wrong URL)
btnTest404.addEventListener("click", async () => {
  await executeApiRequest("GET", `/api/students/unknown-record-9999`);
});

// 7. Reset Form
btnClearForm.addEventListener("click", () => {
  inputId.value = "1";
  inputName.value = "";
  inputRoll.value = "";
  inputCourse.value = "";
  updateEndpointHint();
});

// 8. Next ID helper
nextIdBtn.addEventListener("click", () => {
  if (currentStudentList.length > 0) {
    const maxId = Math.max(...currentStudentList.map(s => s.id));
    inputId.value = maxId + 1;
  } else {
    inputId.value = 1;
  }
  updateEndpointHint();
});

// Copy response JSON
copyJsonBtn.addEventListener("click", () => {
  if (!lastResponseData) return;
  const text = JSON.stringify(lastResponseData, null, 2);
  navigator.clipboard.writeText(text).then(() => {
    const originalText = copyJsonBtn.innerHTML;
    copyJsonBtn.innerHTML = `✓ Copied!`;
    setTimeout(() => {
      copyJsonBtn.innerHTML = originalText;
    }, 1500);
  });
});

// Scroll to guide
document.getElementById("quickHelpBtn").addEventListener("click", () => {
  document.getElementById("guideSection").scrollIntoView({ behavior: "smooth" });
});

// ==========================================================================
// Live Database Table Loader
// ==========================================================================
async function loadStudentsTable() {
  try {
    const res = await fetch("/api/students");
    if (!res.ok) throw new Error("Failed to fetch students");
    const data = await res.json();
    currentStudentList = data;

    renderStudentsTable(data);
  } catch (err) {
    studentsTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="loading-td" style="color: #ef4444;">
          Error loading student database: ${err.message}
        </td>
      </tr>`;
  }
}

function renderStudentsTable(students) {
  if (!students || students.length === 0) {
    studentsTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="loading-td">No students in database. Click <strong>POST</strong> to create one!</td>
      </tr>`;
    return;
  }

  studentsTableBody.innerHTML = students.map(s => `
    <tr>
      <td><span class="student-id-badge">ID ${s.id}</span></td>
      <td><strong>${escapeHtml(s.name)}</strong></td>
      <td><code>${escapeHtml(s.roll)}</code></td>
      <td>${escapeHtml(s.course)}</td>
      <td>
        <button class="action-row-btn" onclick="selectStudentForTesting(${s.id}, '${escapeQuote(s.name)}', '${escapeQuote(s.roll)}', '${escapeQuote(s.course)}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          Select
        </button>
      </td>
    </tr>
  `).join("");
}

// Window scope for onclick in table
window.selectStudentForTesting = function(id, name, roll, course) {
  inputId.value = id;
  inputName.value = name;
  inputRoll.value = roll;
  inputCourse.value = course;
  updateEndpointHint();

  // Scroll smoothly to console
  document.querySelector(".api-console-card").scrollIntoView({ behavior: "smooth" });
};

refreshTableBtn.addEventListener("click", loadStudentsTable);

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeQuote(str) {
  if (!str) return "";
  return String(str).replace(/'/g, "\\'");
}

// ==========================================================================
// Server Status Health Ping
// ==========================================================================
async function checkServerStatus() {
  try {
    const res = await fetch("/api/status");
    if (res.ok) {
      serverStatusText.textContent = "Server Online (127.0.0.1:8000)";
      serverHealthBadge.querySelector(".status-pulse").classList.remove("offline");
    } else {
      throw new Error();
    }
  } catch {
    serverStatusText.textContent = "Server Offline";
    serverHealthBadge.querySelector(".status-pulse").classList.add("offline");
  }
}

// Initialize on Load
updateEndpointHint();
checkServerStatus();
loadStudentsTable();
