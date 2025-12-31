const API_BASE = '/api';

let currentUser = null;
let currentRole = 'student';
let scannerInterval = null;
let stream = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    try {
        checkAuth();
        setupEventListeners();
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});

// Check if user is already logged in
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch(`${API_BASE}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                currentUser = data.user;
                showDashboard(data.user.role);
            } else {
                localStorage.removeItem('token');
                // Ensure login container is visible if not authenticated
                const loginContainer = document.getElementById('loginContainer');
                if (loginContainer) {
                    loginContainer.style.display = 'flex';
                }
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            // Ensure login container is visible on error
            const loginContainer = document.getElementById('loginContainer');
            if (loginContainer) {
                loginContainer.style.display = 'flex';
            }
        }
    } else {
        // No token, ensure login is visible
        const loginContainer = document.getElementById('loginContainer');
        if (loginContainer) {
            loginContainer.style.display = 'flex';
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Role selector
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentRole = e.target.dataset.role;
            updateStudentFields();
        });
    });

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Show/hide register
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');
    
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const loginContainer = document.getElementById('loginContainer');
            const registerCard = document.getElementById('registerCard');
            if (loginContainer) loginContainer.style.display = 'none';
            if (registerCard) registerCard.style.display = 'block';
        });
    }
    
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const registerCard = document.getElementById('registerCard');
            const loginContainer = document.getElementById('loginContainer');
            if (registerCard) registerCard.style.display = 'none';
            if (loginContainer) loginContainer.style.display = 'flex';
        });
    }

    // Teacher forms
    document.getElementById('createClassForm')?.addEventListener('submit', handleCreateClass);
    document.getElementById('generateQRForm')?.addEventListener('submit', handleGenerateQR);
    document.getElementById('reportForm')?.addEventListener('submit', handleViewReport);
    document.getElementById('enrollStudentsForm')?.addEventListener('submit', handleEnrollStudents);

    // Admin forms
    document.getElementById('adminCreateUserForm')?.addEventListener('submit', handleAdminCreateUser);
    document.getElementById('adminUserRole')?.addEventListener('change', updateAdminStudentFields);
}

function updateStudentFields() {
    const fields = ['studentFields', 'studentFields2', 'studentFields3', 'studentFields4'];
    fields.forEach(field => {
        const el = document.getElementById(field);
        if (el) el.style.display = currentRole === 'student' ? 'block' : 'none';
    });
}

function updateAdminStudentFields() {
    const role = document.getElementById('adminUserRole').value;
    const fields = ['adminStudentFields', 'adminStudentFields2', 'adminStudentFields3', 'adminStudentFields4'];
    fields.forEach(field => {
        const el = document.getElementById(field);
        if (el) el.style.display = role === 'student' ? 'block' : 'none';
    });
}

// Authentication
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            showDashboard(data.user.role);
        } else {
            showMessage('loginContainer', data.message || 'Login failed', 'error');
        }
    } catch (error) {
        showMessage('loginContainer', 'Network error. Please try again.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    // Basic validation
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    
    if (!name || !email || !password) {
        showMessage('registerCard', 'Please fill in all required fields', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('registerCard', 'Password must be at least 6 characters', 'error');
        return;
    }
    
    const formData = {
        name: name,
        email: email,
        password: password,
        role: currentRole
    };

    if (currentRole === 'student') {
        const studentId = document.getElementById('regStudentId').value.trim();
        const branch = document.getElementById('regBranch').value.trim();
        const semester = document.getElementById('regSemester').value;
        const section = document.getElementById('regSection').value.trim();
        
        if (!studentId || !branch || !semester || !section) {
            showMessage('registerCard', 'Please fill in all student fields (Student ID, Branch, Semester, Section)', 'error');
            return;
        }
        
        formData.studentId = studentId;
        formData.branch = branch;
        formData.semester = parseInt(semester);
        formData.section = section;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            showDashboard(data.user.role);
        } else {
            // Handle validation errors
            let errorMessage = data.message || 'Registration failed';
            if (data.errors && Array.isArray(data.errors)) {
                errorMessage = data.errors.map(err => err.msg || err.message).join(', ');
            }
            showMessage('registerCard', errorMessage, 'error');
            console.error('Registration error:', data);
        }
    } catch (error) {
        console.error('Registration network error:', error);
        showMessage('registerCard', 'Network error. Please check your connection and try again.', 'error');
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    document.querySelectorAll('.dashboard').forEach(d => d.style.display = 'none');
    document.getElementById('loginContainer').style.display = 'flex';
    stopScanner();
}

function showDashboard(role) {
    const loginContainer = document.getElementById('loginContainer');
    if (loginContainer) {
        loginContainer.style.display = 'none';
    }
    
    document.querySelectorAll('.dashboard').forEach(d => {
        d.style.display = 'none';
    });
    
    if (role === 'student') {
        const dashboard = document.getElementById('studentDashboard');
        if (dashboard) {
            dashboard.style.display = 'block';
            loadStudentData();
        }
    } else if (role === 'teacher') {
        const dashboard = document.getElementById('teacherDashboard');
        if (dashboard) {
            dashboard.style.display = 'block';
            loadTeacherData();
        }
    } else if (role === 'admin') {
        const dashboard = document.getElementById('adminDashboard');
        if (dashboard) {
            dashboard.style.display = 'block';
            loadAdminData();
        }
    }
}

// Student Functions
async function loadStudentData() {
    await Promise.all([
        loadStudentClasses(),
        loadAttendanceHistory(),
        loadStudentStatistics()
    ]);
}

async function loadStudentClasses() {
    try {
        const response = await fetch(`${API_BASE}/student/classes`, {
            headers: getAuthHeaders()
        });
        const classes = await response.json();
        const container = document.getElementById('studentClasses');
        if (classes.length === 0) {
            container.innerHTML = '<p>No classes enrolled yet.</p>';
        } else {
            container.innerHTML = classes.map(c => `
                <div style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 10px 0;">
                    <strong>${c.subject}</strong> - ${c.branch} Sem ${c.semester} Sec ${c.section}<br>
                    <small>Teacher: ${c.teacherId.name}</small>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

async function loadAttendanceHistory() {
    try {
        const response = await fetch(`${API_BASE}/student/attendance/history`, {
            headers: getAuthHeaders()
        });
        const records = await response.json();
        const container = document.getElementById('attendanceHistory');
        if (records.length === 0) {
            container.innerHTML = '<p>No attendance records yet.</p>';
        } else {
            container.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Subject</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.slice(0, 10).map(r => `
                            <tr>
                                <td>${new Date(r.date).toLocaleDateString()}</td>
                                <td>${r.classId.subject}</td>
                                <td><span style="color: ${r.status === 'present' ? 'green' : 'red'}">${r.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

async function loadStudentStatistics() {
    try {
        const response = await fetch(`${API_BASE}/student/attendance/statistics`, {
            headers: getAuthHeaders()
        });
        const stats = await response.json();
        const container = document.getElementById('studentStats');
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Total Classes</h4>
                    <div class="stat-value">${stats.overall.total}</div>
                </div>
                <div class="stat-card">
                    <h4>Present</h4>
                    <div class="stat-value">${stats.overall.present}</div>
                </div>
                <div class="stat-card">
                    <h4>Attendance %</h4>
                    <div class="stat-value">${stats.overall.percentage}%</div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// QR Scanner
async function startScanner() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        const video = document.getElementById('video');
        video.srcObject = stream;
        document.getElementById('stopBtn').style.display = 'inline-block';
        
        scannerInterval = setInterval(scanQR, 500);
    } catch (error) {
        showMessage('scannerContainer', 'Camera access denied. Please enable camera permissions.', 'error');
    }
}

function stopScanner() {
    if (scannerInterval) {
        clearInterval(scannerInterval);
        scannerInterval = null;
    }
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    document.getElementById('stopBtn').style.display = 'none';
}

function scanQR() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
            try {
                const qrData = JSON.parse(code.data);
                markAttendance(qrData);
            } catch (error) {
                console.error('Invalid QR code:', error);
            }
        }
    }
}

async function markAttendance(qrData) {
    try {
        const response = await fetch(`${API_BASE}/student/attendance/scan`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(qrData)
        });

        const data = await response.json();
        const resultDiv = document.getElementById('scanResult');
        
        if (response.ok) {
            resultDiv.innerHTML = `<div class="message success">${data.message}</div>`;
            stopScanner();
            loadAttendanceHistory();
            loadStudentStatistics();
        } else {
            resultDiv.innerHTML = `<div class="message error">${data.message}</div>`;
        }
    } catch (error) {
        document.getElementById('scanResult').innerHTML = 
            '<div class="message error">Error marking attendance</div>';
    }
}

// Teacher Functions
async function loadTeacherData() {
    await Promise.all([
        loadTeacherClasses(),
        loadActiveSessions(),
        loadAllStudents()
    ]);
}

async function loadTeacherClasses() {
    try {
        const response = await fetch(`${API_BASE}/teacher/classes`, {
            headers: getAuthHeaders()
        });
        const classes = await response.json();
        const container = document.getElementById('teacherClasses');
        
        // Populate class selectors
        const qrSelect = document.getElementById('qrClassSelect');
        const reportSelect = document.getElementById('reportClassSelect');
        const enrollSelect = document.getElementById('enrollClassSelect');
        [qrSelect, reportSelect, enrollSelect].forEach(select => {
            if (select) {
                select.innerHTML = '<option value="">Select Class</option>' +
                    classes.map(c => `<option value="${c._id}">${c.subject} - ${c.branch} Sem ${c.semester} Sec ${c.section}</option>`).join('');
            }
        });

        if (classes.length === 0) {
            container.innerHTML = '<p>No classes created yet.</p>';
        } else {
            container.innerHTML = classes.map(c => `
                <div style="padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 10px 0;">
                    <strong>${c.subject}</strong> - ${c.branch} Sem ${c.semester} Sec ${c.section}<br>
                    <small>Enrolled: ${c.enrolledStudents.length} students</small>
                    <button class="btn btn-secondary" onclick="viewClassDetails('${c._id}')" style="width: auto; padding: 5px 15px; margin-top: 10px;">View/Manage Students</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

async function handleCreateClass(e) {
    e.preventDefault();
    const formData = {
        subject: document.getElementById('classSubject').value,
        branch: document.getElementById('classBranch').value,
        semester: parseInt(document.getElementById('classSemester').value),
        section: document.getElementById('classSection').value
    };

    try {
        const response = await fetch(`${API_BASE}/teacher/classes`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (response.ok) {
            showMessage('teacherDashboard', 'Class created successfully!', 'success');
            e.target.reset();
            loadTeacherClasses();
        } else {
            showMessage('teacherDashboard', data.message || 'Failed to create class', 'error');
        }
    } catch (error) {
        showMessage('teacherDashboard', 'Network error', 'error');
    }
}

async function handleGenerateQR(e) {
    e.preventDefault();
    const classId = document.getElementById('qrClassSelect').value;
    const duration = parseInt(document.getElementById('qrDuration').value) * 60000; // Convert to milliseconds

    try {
        const response = await fetch(`${API_BASE}/teacher/sessions/generate`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ classId, duration })
        });

        const data = await response.json();
        if (response.ok) {
            const qrDiv = document.getElementById('qrCodeDisplay');
            qrDiv.innerHTML = `
                <img src="${data.qrCode}" alt="QR Code">
                <p><strong>Session expires at:</strong> ${new Date(data.session.endTime).toLocaleString()}</p>
            `;
            loadActiveSessions();
        } else {
            showMessage('teacherDashboard', data.message || 'Failed to generate QR', 'error');
        }
    } catch (error) {
        showMessage('teacherDashboard', 'Network error', 'error');
    }
}

async function loadActiveSessions() {
    try {
        const response = await fetch(`${API_BASE}/teacher/sessions/active`, {
            headers: getAuthHeaders()
        });
        const sessions = await response.json();
        const container = document.getElementById('activeSessions');
        
        if (sessions.length === 0) {
            container.innerHTML = '<p>No active sessions.</p>';
        } else {
            container.innerHTML = `
                <h4>Active Sessions</h4>
                ${sessions.map(s => `
                    <div style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 10px 0;">
                        <strong>${s.classId.subject}</strong> - Expires: ${new Date(s.endTime).toLocaleString()}
                        <button class="btn btn-danger" onclick="stopSession('${s._id}')" style="margin-left: 10px; width: auto; padding: 5px 15px;">Stop</button>
                    </div>
                `).join('')}
            `;
        }
    } catch (error) {
        console.error('Error loading sessions:', error);
    }
}

async function stopSession(sessionId) {
    try {
        const response = await fetch(`${API_BASE}/teacher/sessions/${sessionId}/stop`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (response.ok) {
            loadActiveSessions();
        }
    } catch (error) {
        console.error('Error stopping session:', error);
    }
}

async function handleViewReport(e) {
    e.preventDefault();
    const classId = document.getElementById('reportClassSelect').value;
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;

    const params = new URLSearchParams();
    if (classId) params.append('classId', classId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    try {
        const response = await fetch(`${API_BASE}/teacher/reports?${params}`, {
            headers: getAuthHeaders()
        });
        const records = await response.json();
        const container = document.getElementById('reportResults');
        
        if (records.length === 0) {
            container.innerHTML = '<p>No records found.</p>';
        } else {
            container.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Subject</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map(r => `
                            <tr>
                                <td>${r.studentId.name} (${r.studentId.studentId})</td>
                                <td>${r.classId.subject}</td>
                                <td>${new Date(r.date).toLocaleDateString()}</td>
                                <td>${r.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error('Error loading report:', error);
    }
}

async function exportReport(format) {
    const classId = document.getElementById('reportClassSelect').value;
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;

    const params = new URLSearchParams();
    if (classId) params.append('classId', classId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('format', format);

    const token = localStorage.getItem('token');
    const url = `${API_BASE}/teacher/reports/export${format === 'pdf' ? '/pdf' : ''}?${params}`;
    window.open(url + `&token=${token}`, '_blank');
}

// Admin Functions
async function loadAdminData() {
    await Promise.all([
        loadAdminStatistics(),
        loadUsers(),
        loadAllClasses()
    ]);
}

async function loadAdminStatistics() {
    try {
        const response = await fetch(`${API_BASE}/admin/statistics`, {
            headers: getAuthHeaders()
        });
        const stats = await response.json();
        const container = document.getElementById('adminStats');
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Total Users</h4>
                    <div class="stat-value">${stats.totalUsers}</div>
                </div>
                <div class="stat-card">
                    <h4>Teachers</h4>
                    <div class="stat-value">${stats.totalTeachers}</div>
                </div>
                <div class="stat-card">
                    <h4>Students</h4>
                    <div class="stat-value">${stats.totalStudents}</div>
                </div>
                <div class="stat-card">
                    <h4>Classes</h4>
                    <div class="stat-value">${stats.totalClasses}</div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/admin/users`, {
            headers: getAuthHeaders()
        });
        const users = await response.json();
        const container = document.getElementById('usersList');
        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(u => `
                        <tr>
                            <td>${u.name}</td>
                            <td>${u.email}</td>
                            <td>${u.role}</td>
                            <td>${u.isActive ? 'Active' : 'Inactive'}</td>
                            <td>
                                <button class="btn btn-secondary" onclick="toggleUserStatus('${u._id}', ${!u.isActive})" style="width: auto; padding: 5px 15px;">
                                    ${u.isActive ? 'Disable' : 'Enable'}
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function loadAllClasses() {
    try {
        const response = await fetch(`${API_BASE}/admin/classes`, {
            headers: getAuthHeaders()
        });
        const classes = await response.json();
        const container = document.getElementById('allClasses');
        container.innerHTML = classes.map(c => `
            <div style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 10px 0;">
                <strong>${c.subject}</strong> - ${c.branch} Sem ${c.semester} Sec ${c.section}<br>
                <small>Teacher: ${c.teacherId.name} | Students: ${c.enrolledStudents.length}</small>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

function showCreateUserForm() {
    document.getElementById('createUserForm').style.display = 'block';
}

function hideCreateUserForm() {
    document.getElementById('createUserForm').style.display = 'none';
    document.getElementById('adminCreateUserForm').reset();
}

async function handleAdminCreateUser(e) {
    e.preventDefault();
    const formData = {
        name: document.getElementById('adminUserName').value,
        email: document.getElementById('adminUserEmail').value,
        password: document.getElementById('adminUserPassword').value,
        role: document.getElementById('adminUserRole').value
    };

    if (formData.role === 'student') {
        formData.studentId = document.getElementById('adminStudentId').value;
        formData.branch = document.getElementById('adminBranch').value;
        formData.semester = parseInt(document.getElementById('adminSemester').value);
        formData.section = document.getElementById('adminSection').value;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/users`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (response.ok) {
            showMessage('adminDashboard', 'User created successfully!', 'success');
            hideCreateUserForm();
            loadUsers();
        } else {
            showMessage('adminDashboard', data.message || 'Failed to create user', 'error');
        }
    } catch (error) {
        showMessage('adminDashboard', 'Network error', 'error');
    }
}

async function toggleUserStatus(userId, status) {
    try {
        const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
            method: 'PUT',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: status })
        });
        if (response.ok) {
            loadUsers();
        }
    } catch (error) {
        console.error('Error updating user:', error);
    }
}

// Helper functions
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}` };
}

// Load all students for enrollment
async function loadAllStudents() {
    try {
        const response = await fetch(`${API_BASE}/admin/users?role=student`, {
            headers: getAuthHeaders()
        });
        const students = await response.json();
        const container = document.getElementById('studentsList');
        
        if (!container) return;
        
        if (students.length === 0) {
            container.innerHTML = '<p>No students found. Create student accounts first.</p>';
        } else {
            container.innerHTML = students.map(s => `
                <label style="display: block; padding: 8px; border-bottom: 1px solid #e2e8f0; cursor: pointer;">
                    <input type="checkbox" value="${s._id}" class="student-checkbox" style="margin-right: 10px;">
                    <strong>${s.name}</strong> (${s.studentId || 'No ID'}) - ${s.branch || ''} Sem ${s.semester || ''} Sec ${s.section || ''}
                </label>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading students:', error);
        const container = document.getElementById('studentsList');
        if (container) {
            container.innerHTML = '<p>Error loading students. Make sure you have access.</p>';
        }
    }
}

// Enroll students in class
async function handleEnrollStudents(e) {
    e.preventDefault();
    const classId = document.getElementById('enrollClassSelect').value;
    
    if (!classId) {
        showMessage('enrollResult', 'Please select a class', 'error');
        return;
    }
    
    const checkboxes = document.querySelectorAll('.student-checkbox:checked');
    if (checkboxes.length === 0) {
        showMessage('enrollResult', 'Please select at least one student', 'error');
        return;
    }
    
    const studentIds = Array.from(checkboxes).map(cb => cb.value);
    
    try {
        const response = await fetch(`${API_BASE}/teacher/classes/${classId}/enroll`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentIds })
        });
        
        const data = await response.json();
        if (response.ok) {
            showMessage('enrollResult', `Successfully enrolled ${studentIds.length} student(s)!`, 'success');
            // Uncheck all checkboxes
            checkboxes.forEach(cb => cb.checked = false);
            // Reload classes to show updated enrollment
            loadTeacherClasses();
        } else {
            showMessage('enrollResult', data.message || 'Failed to enroll students', 'error');
        }
    } catch (error) {
        showMessage('enrollResult', 'Network error. Please try again.', 'error');
    }
}

// View class details and enrolled students
async function viewClassDetails(classId) {
    try {
        const response = await fetch(`${API_BASE}/teacher/classes/${classId}`, {
            headers: getAuthHeaders()
        });
        const classData = await response.json();
        
        if (response.ok) {
            const enrolledList = classData.enrolledStudents.length > 0 
                ? classData.enrolledStudents.map(s => `
                    <div style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 5px 0; display: flex; justify-content: space-between; align-items: center;">
                        <span><strong>${s.name}</strong> (${s.studentId || 'No ID'}) - ${s.email}</span>
                        <button class="btn btn-danger" onclick="removeStudent('${classId}', '${s._id}')" style="width: auto; padding: 5px 15px;">Remove</button>
                    </div>
                `).join('')
                : '<p>No students enrolled yet.</p>';
            
            const modal = document.createElement('div');
            modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; justify-content: center; align-items: center;';
            modal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 12px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                    <h2>${classData.subject} - ${classData.branch} Sem ${classData.semester} Sec ${classData.section}</h2>
                    <h3 style="margin-top: 20px;">Enrolled Students (${classData.enrolledStudents.length})</h3>
                    <div style="margin-top: 15px;">
                        ${enrolledList}
                    </div>
                    <button class="btn btn-secondary" onclick="this.closest('div[style*=\"position: fixed\"]').remove()" style="margin-top: 20px; width: auto; padding: 10px 20px;">Close</button>
                </div>
            `;
            document.body.appendChild(modal);
        }
    } catch (error) {
        console.error('Error loading class details:', error);
        showMessage('teacherDashboard', 'Error loading class details', 'error');
    }
}

// Remove student from class
async function removeStudent(classId, studentId) {
    if (!confirm('Are you sure you want to remove this student from the class?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/teacher/classes/${classId}/enroll/${studentId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            showMessage('teacherDashboard', 'Student removed successfully', 'success');
            viewClassDetails(classId); // Refresh the modal
            loadTeacherClasses(); // Refresh class list
        } else {
            const data = await response.json();
            showMessage('teacherDashboard', data.message || 'Failed to remove student', 'error');
        }
    } catch (error) {
        showMessage('teacherDashboard', 'Network error', 'error');
    }
}

function showMessage(containerId, message, type) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }
    
    // Remove existing messages
    const existingMessages = container.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    msgDiv.textContent = message;
    msgDiv.style.marginTop = '10px';
    msgDiv.style.marginBottom = '10px';
    container.insertBefore(msgDiv, container.firstChild);
    setTimeout(() => msgDiv.remove(), 8000);
}

