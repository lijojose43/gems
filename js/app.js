// Gems Academy - Main Application
class GemsApp {
  constructor() {
    this.currentEditId = null;
    this.navigationHistory = [];
    this.init();
  }

  async init() {
    // Initialize app
    this.setupEventListeners();
    this.updateDashboard();
    this.renderStudents();
    this.renderCommunication();

    // Load settings
    this.loadSettings();

    // Setup auto-backup
    this.setupAutoBackup();

    // Check for PWA install prompt
    this.setupPWAInstall();

    console.log("Gems Academy initialized");
  }

  setupEventListeners() {
    // Student form
    document.getElementById("student-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleStudentSubmit();
    });

    // Communication form
    document
      .getElementById("communication-form")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleCommunicationSubmit();
      });

    // Add student button
    document.getElementById("add-student-btn").addEventListener("click", () => {
      this.openStudentModal();
    });

    // Mobile add button
    const mobileAddBtn = document.getElementById("mobile-add-btn");
    if (mobileAddBtn) {
      mobileAddBtn.addEventListener("click", () => {
        this.openStudentModal();
      });
    }

    // Add communication button
    document
      .getElementById("add-communication-btn")
      .addEventListener("click", () => {
        this.openCommunicationModal();
      });

    // Export buttons
    document
      .getElementById("export-students-btn")
      .addEventListener("click", () => {
        this.exportStudents();
      });

    document
      .getElementById("export-communication-btn")
      .addEventListener("click", () => {
        this.exportCommunication();
      });

    document.getElementById("export-all-btn").addEventListener("click", () => {
      this.exportAllData();
    });

    // Communication filter
    document
      .getElementById("communication-filter")
      .addEventListener("change", (e) => {
        this.filterCommunication(e.target.value);
      });

    // Settings toggle button
    document.getElementById("settings-toggle").addEventListener("click", () => {
      this.navigateToSection("settings");
    });

    // Settings form
    document.getElementById("settings-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSettingsSubmit();
    });

    // Reset settings button
    document
      .getElementById("reset-settings-btn")
      .addEventListener("click", () => {
        this.resetSettings();
      });

    // Settings go back link
    document
      .getElementById("settings-go-back")
      .addEventListener("click", (e) => {
        e.preventDefault();
        this.goBack();
      });
  }

  // Dashboard Methods
  updateDashboard() {
    const stats = storage.getStats();

    // Update stat cards
    document.getElementById("total-students").textContent = ui.formatNumber(
      stats.totalStudents,
    );
    document.getElementById("recent-calls").textContent = ui.formatNumber(
      stats.recentCalls,
    );
    document.getElementById("pending-followups").textContent = ui.formatNumber(
      stats.pendingFollowups,
    );

    // Update recent activity
    this.renderRecentActivity(stats.recentActivity);
  }

  renderRecentActivity(activities) {
    const container = document.getElementById("recent-activity-list");
    container.innerHTML = "";

    if (activities.length === 0) {
      container.innerHTML = '<p class="text-muted">No recent activity</p>';
      return;
    }

    activities.forEach((activity) => {
      const item = ui.createActivityItem(activity);
      container.appendChild(item);
    });
  }

  // Student Management
  renderStudents(searchQuery = "") {
    const container = document.getElementById("students-list");
    container.innerHTML = "";

    let students = searchQuery
      ? storage.searchStudents(searchQuery)
      : storage.getStudents();

    if (students.length === 0) {
      container.innerHTML = `
                <div class="text-center" style="grid-column: 1 / -1;">
                    <p class="text-muted">No students found</p>
                    <button class="btn btn-primary" onclick="app.openStudentModal()">
                        Add Your First Student
                    </button>
                </div>
            `;
      return;
    }

    students.forEach((student) => {
      const card = ui.createStudentCard(student);
      container.appendChild(card);
    });
  }

  openStudentModal(studentId = null) {
    this.currentEditId = studentId;

    const modal = document.getElementById("student-modal");
    const title = document.getElementById("student-modal-title");

    if (studentId) {
      const student = storage.getStudent(studentId);
      if (student) {
        title.textContent = "Edit Student";
        ui.populateForm("student-form", student);
      }
    } else {
      title.textContent = "Add New Student";
      ui.clearForm("student-form");
    }

    ui.openModal("student-modal");
  }

  handleStudentSubmit() {
    const validation = ui.validateForm("student-form");
    if (!validation.isValid) {
      ui.showToast("Please fill in all required fields", "error");
      return;
    }

    const formData = ui.getFormData("student-form");

    // Parse remarks if provided
    if (formData.remarks) {
      formData.remarks = [
        {
          date: new Date().toISOString().split("T")[0],
          remark: formData.remarks,
        },
      ];
    }

    if (this.currentEditId) {
      // Update existing student
      const updatedStudent = storage.updateStudent(
        this.currentEditId,
        formData,
      );
      if (updatedStudent) {
        ui.showToast("Student updated successfully", "success");
        this.logActivity(
          "student_updated",
          `Updated student: ${updatedStudent.name}`,
        );
      } else {
        ui.showToast("Error updating student", "error");
        return;
      }
    } else {
      // Add new student
      const newStudent = storage.addStudent(formData);
      if (newStudent) {
        ui.showToast("Student added successfully", "success");
        this.logActivity(
          "student_added",
          `Added new student: ${newStudent.name}`,
        );
      } else {
        ui.showToast("Error adding student", "error");
        return;
      }
    }

    ui.closeModal("student-modal");
    this.renderStudents();
    this.updateDashboard();
  }

  editStudent(studentId) {
    this.openStudentModal(studentId);
  }

  viewStudentDetails(studentId) {
    const student = storage.getStudent(studentId);
    if (!student) return;

    this.currentViewingId = studentId;
    this.renderStudentDetails(student);
    ui.openModal("student-details-modal");
  }

  deleteStudent(studentId) {
    const student = storage.getStudent(studentId);
    if (!student) return;

    ui.confirm(
      `Are you sure you want to delete ${student.name}? This action cannot be undone.`,
      () => {
        if (storage.deleteStudent(studentId)) {
          ui.showToast("Student deleted successfully", "success");
          this.logActivity(
            "student_deleted",
            `Deleted student: ${student.name}`,
          );
          this.renderStudents();
          this.updateDashboard();
        } else {
          ui.showToast("Error deleting student", "error");
        }
      },
    );
  }

  // Communication Methods
  renderCommunication(filterType = "all") {
    const container = document.getElementById("communication-list");
    container.innerHTML = "";

    let communication = storage.getCommunication();
    const students = storage.getStudents();

    // Apply filter
    if (filterType !== "all") {
      communication = communication.filter((c) => c.type === filterType);
    }

    // Sort by date (newest first)
    communication.sort(
      (a, b) =>
        new Date(b.date + " " + b.time) - new Date(a.date + " " + a.time),
    );

    if (communication.length === 0) {
      container.innerHTML =
        '<p class="text-muted">No communication logs found</p>';
      return;
    }

    communication.forEach((log) => {
      const student = students.find((s) => s.id === log.studentId);
      const studentName = student ? student.name : "Unknown Student";
      const item = ui.createCommunicationItem(log, studentName);
      container.appendChild(item);
    });
  }

  filterCommunication(type) {
    this.renderCommunication(type);
  }

  openCommunicationModal() {
    // Populate student dropdown
    const select = document.getElementById("comm-student");
    const students = storage.getStudents();

    select.innerHTML = '<option value="">Select a student</option>';
    students.forEach((student) => {
      const option = document.createElement("option");
      option.value = student.id;
      option.textContent = student.name;
      select.appendChild(option);
    });

    // Set default date and time
    document.getElementById("comm-date").value = new Date()
      .toISOString()
      .split("T")[0];
    document.getElementById("comm-time").value = new Date()
      .toTimeString()
      .slice(0, 5);

    ui.clearForm("communication-form");
    ui.openModal("communication-modal");
  }

  handleCommunicationSubmit() {
    const validation = ui.validateForm("communication-form");
    if (!validation.isValid) {
      ui.showToast("Please fill in all required fields", "error");
      return;
    }

    const formData = ui.getFormData("communication-form");
    const newLog = storage.addCommunication(formData);

    if (newLog) {
      ui.showToast("Communication log added successfully", "success");

      const student = storage.getStudent(formData.studentId);
      this.logActivity(
        formData.type,
        `${formData.type} with ${student ? student.name : "Unknown Student"}`,
      );

      ui.closeModal("communication-modal");
      this.renderCommunication();
      this.updateDashboard();
    } else {
      ui.showToast("Error adding communication log", "error");
    }
  }

  // Communication Actions
  callStudent(mobileNumber) {
    if (!mobileNumber) {
      ui.showToast("No mobile number available", "error");
      return;
    }

    // Log the call
    const students = storage.getStudents();
    const student = students.find(
      (s) => s.mobile1 === mobileNumber || s.mobile2 === mobileNumber,
    );

    if (student) {
      // Create communication log for the call
      const callLog = {
        studentId: student.id,
        type: "call",
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().slice(0, 5),
        duration: "",
        notes: "Call initiated from app",
      };

      storage.addCommunication(callLog);
      this.logActivity("call", `Called ${student.name}`);
    }

    // Initiate phone call
    window.location.href = `tel:${mobileNumber}`;
  }

  whatsappStudent(mobileNumber) {
    if (!mobileNumber) {
      ui.showToast("No mobile number available", "error");
      return;
    }

    // Log the WhatsApp message
    const students = storage.getStudents();
    const student = students.find(
      (s) => s.mobile1 === mobileNumber || s.mobile2 === mobileNumber,
    );

    if (student) {
      const whatsappLog = {
        studentId: student.id,
        type: "whatsapp",
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().slice(0, 5),
        duration: "",
        notes: "WhatsApp message initiated from app",
      };

      storage.addCommunication(whatsappLog);
      this.logActivity("whatsapp", `WhatsApp message to ${student.name}`);
    }

    // Open WhatsApp
    const message = encodeURIComponent("Hello from Gems Academy!");
    window.location.href = `https://wa.me/${mobileNumber.replace(/[^\d]/g, "")}?text=${message}`;
  }

  // Export Methods
  exportStudents() {
    try {
      const students = storage.getStudents();
      const csvContent = csvManager.exportStudents(students);
      const filename = csvManager.generateFilename("gems_students");
      csvManager.downloadCSV(csvContent, filename);
      ui.showToast("Students exported successfully", "success");
    } catch (error) {
      ui.showToast("Error exporting students", "error");
    }
  }

  exportCommunication() {
    try {
      const communication = storage.getCommunication();
      const students = storage.getStudents();
      const csvContent = csvManager.exportCommunication(
        communication,
        students,
      );
      const filename = csvManager.generateFilename("gems_communication");
      csvManager.downloadCSV(csvContent, filename);
      ui.showToast("Communication logs exported successfully", "success");
    } catch (error) {
      ui.showToast("Error exporting communication logs", "error");
    }
  }

  exportAllData() {
    try {
      const data = storage.exportData();

      // Create separate CSV files for students and communication
      const studentsCSV = csvManager.exportStudents(data.students || []);
      const communicationCSV = csvManager.exportCommunication(
        data.communication || [],
        data.students || [],
      );

      // Generate filename for CSV
      const filename = csvManager.generateFilename("gems_backup", "csv");

      // Combine both CSVs into one file with proper headers
      const combinedCSV = this.combineExportCSVs(studentsCSV, communicationCSV);

      csvManager.downloadCSV(combinedCSV, filename);
      ui.showToast("All data exported successfully as CSV", "success");
    } catch (error) {
      ui.showToast("Error exporting data", "error");
    }
  }

  combineExportCSVs(studentsCSV, communicationCSV) {
    const sections = [];

    if (studentsCSV) {
      sections.push("STUDENTS");
      sections.push(studentsCSV);
    }

    if (communicationCSV) {
      sections.push("");
      sections.push("COMMUNICATION LOGS");
      sections.push(communicationCSV);
    }

    return sections.join("\n");
  }

  // Activity Logging
  logActivity(type, description) {
    const activity = {
      type,
      description,
      date: new Date().toISOString(),
    };

    // Store in a separate activities array (could be enhanced later)
    let activities = storage.get("gems_activities") || [];
    activities.unshift(activity);

    // Keep only last 100 activities
    activities = activities.slice(0, 100);

    storage.set("gems_activities", activities);
  }

  // Auto Backup
  setupAutoBackup() {
    // Check for auto-backup on app start
    const backupData = storage.autoBackup();
    if (backupData) {
      console.log("Auto backup created");
    }

    // Set up periodic backup (every hour)
    setInterval(
      () => {
        storage.autoBackup();
      },
      60 * 60 * 1000,
    );
  }

  // PWA Install
  setupPWAInstall() {
    let deferredPrompt;

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;

      // Show install button or banner
      this.showInstallPrompt();
    });

    window.addEventListener("appinstalled", () => {
      ui.showToast("Gems Academy installed successfully!", "success");
      deferredPrompt = null;
    });
  }

  showInstallPrompt() {
    const installBanner = document.createElement("div");
    installBanner.className = "install-banner";
    installBanner.innerHTML = `
            <div class="install-banner-content">
                <span>Install Gems Academy for offline access</span>
                <button id="install-btn" class="btn btn-primary">Install</button>
                <button id="dismiss-install" class="btn-icon">&times;</button>
            </div>
        `;

    document.body.appendChild(installBanner);

    document.getElementById("install-btn").addEventListener("click", () => {
      this.installPWA();
      installBanner.remove();
    });

    document.getElementById("dismiss-install").addEventListener("click", () => {
      installBanner.remove();
    });
  }

  async installPWA() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      ui.showToast("Installing Gems Academy...", "info");
    }

    deferredPrompt = null;
  }

  renderStudentDetails(student) {
    const container = document.getElementById("student-details-content");

    const remarksHtml =
      student.remarks && student.remarks.length > 0
        ? student.remarks
            .map(
              (remark) => `
            <div class="remark-item">
                <div class="remark-date">${ui.formatDate(remark.date)}</div>
                <div class="remark-text">${ui.escapeHtml(remark.remark)}</div>
            </div>
        `,
            )
            .join("")
        : '<p class="text-muted">No remarks recorded</p>';

    const communicationLogs = storage
      .getCommunication()
      .filter((log) => log.studentId === student.id);
    const communicationHtml =
      communicationLogs.length > 0
        ? communicationLogs
            .map((log) => {
              const typeIcon =
                {
                  call: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>',
                  whatsapp:
                    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>',
                  meeting:
                    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
                }[log.type] ||
                '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';

              return `
                <div class="communication-log-item">
                    <div class="log-header">
                        <span class="log-type">${typeIcon} ${log.type.charAt(0).toUpperCase() + log.type.slice(1)}</span>
                        <span class="log-date">${ui.formatDate(log.date)} at ${log.time}</span>
                    </div>
                    ${log.duration ? `<div class="log-duration"><strong>Duration:</strong> ${ui.escapeHtml(log.duration)}</div>` : ""}
                    <div class="log-notes">${ui.escapeHtml(log.notes)}</div>
                </div>
            `;
            })
            .join("")
        : '<p class="text-muted">No communication logs recorded</p>';

    container.innerHTML = `
        <div class="student-details">
            <div class="student-details-header">
                <h2>${ui.escapeHtml(student.name)}</h2>
                <div class="student-details-actions">
                    <button class="btn btn-primary" onclick="app.callStudent('${student.mobile1}')">
                        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        Call
                    </button>
                    <button class="btn btn-secondary" onclick="app.whatsappStudent('${student.mobile1}')">
                        <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.42 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.18-.3.04-1.26.33.33-1.22.04-.31-.18-.3a8.188 8.188 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24h.01z"/>
                            <path d="M9.91 7.86c-.2 0-.5.1-.7.3-.3.3-.9.9-.9 2.1s.9 2.4 1 2.5c.1.1 1.7 2.7 4.2 3.8 2.1.9 2.5.7 2.9.7.4 0 .4-.2.5-.4.1-.2.4-.5.5-.7.1-.2.1-.4 0-.5-.1-.1-.4-.5-.5-.6-.1-.1-.2-.2-.3-.2-.1 0-.2.1-.3.1-.1.1-.2.1-.3.2-.1.1-.2.3-.3.3-.1.1-.2.1-.3.1-.1-.1-.3-.2-.5-.3-.2-.1-.5-.2-.8-.2-.3 0-.8.1-1.2.5-.5.5-1.2 1.2-1.2 2.9s1.2 3.4 1.4 3.6c.2.2 2.7 4.2 6.5 5.3.4.1.8.2 1.1.3.4.1.7.1 1 .1.3 0 .9-.1 1.3-.5.4-.4.7-1 .7-1.5 0-.1 0-.2-.1-.3-.1-.1-.2-.2-.3-.2z"/>
                        </svg>
                        WhatsApp
                    </button>
                </div>
            </div>

            <div class="student-details-grid">
                <div class="details-section">
                    <h3>Basic Information</h3>
                    <div class="details-grid">
                        <div class="detail-item">
                            <label>Class:</label>
                            <span>${ui.escapeHtml(student.class)}</span>
                        </div>
                        <div class="detail-item">
                            <label>School:</label>
                            <span>${ui.escapeHtml(student.school)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Place:</label>
                            <span>${ui.escapeHtml(student.place)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Province:</label>
                            <span>${ui.escapeHtml(student.province || "Not specified")}</span>
                        </div>
                        <div class="detail-item">
                            <label>Gems Joining Year:</label>
                            <span>${ui.escapeHtml(student.gemsJoiningYear)}</span>
                        </div>
                    </div>
                </div>

                <div class="details-section">
                    <h3>Contact Information</h3>
                    <div class="details-grid">
                        <div class="detail-item">
                            <label>Mobile 1:</label>
                            <span><a href="tel:${student.mobile1}">${ui.escapeHtml(student.mobile1)}</a></span>
                        </div>
                        <div class="detail-item">
                            <label>Mobile 2:</label>
                            <span>${student.mobile2 ? `<a href="tel:${student.mobile2}">${ui.escapeHtml(student.mobile2)}</a>` : "Not provided"}</span>
                        </div>
                    </div>
                </div>

                <div class="details-section">
                    <h3>Family Information</h3>
                    <div class="details-grid">
                        <div class="detail-item">
                            <label>Father's Name:</label>
                            <span>${ui.escapeHtml(student.fathersName || "Not provided")}</span>
                        </div>
                        <div class="detail-item">
                            <label>Father's Occupation:</label>
                            <span>${ui.escapeHtml(student.fathersOccupation || "Not provided")}</span>
                        </div>
                        <div class="detail-item">
                            <label>Mother's Name:</label>
                            <span>${ui.escapeHtml(student.mothersName || "Not provided")}</span>
                        </div>
                        <div class="detail-item">
                            <label>Mother's Occupation:</label>
                            <span>${ui.escapeHtml(student.mothersOccupation || "Not provided")}</span>
                        </div>
                        <div class="detail-item full-width">
                            <label>Siblings:</label>
                            <span>${ui.escapeHtml(student.siblings || "No siblings")}</span>
                        </div>
                    </div>
                </div>

                <div class="details-section">
                    <h3>Remarks History</h3>
                    <div class="remarks-list">
                        ${remarksHtml}
                    </div>
                </div>

                <div class="details-section">
                    <h3>Communication Logs (${communicationLogs.length})</h3>
                    <div class="communication-logs">
                        ${communicationHtml}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Setup edit button
    const editBtn = document.getElementById("edit-from-details-btn");
    if (editBtn) {
      editBtn.onclick = () => {
        ui.closeModal("student-details-modal");
        this.editStudent(student.id);
      };
    }
  }

  // Search and Filter
  searchStudents(query) {
    this.renderStudents(query);
  }

  // Data Management
  clearAllData() {
    ui.confirm(
      "Are you sure you want to delete all data? This action cannot be undone.",
      () => {
        if (storage.clearAllData()) {
          ui.showToast("All data cleared successfully", "success");
          this.updateDashboard();
          this.renderStudents();
          this.renderCommunication();
        } else {
          ui.showToast("Error clearing data", "error");
        }
      },
    );
  }

  // Settings Methods
  loadSettings() {
    const formLink = storage.getGoogleFormLink();
    const meetLink = storage.getGoogleMeetLink();

    document.getElementById("google-form-link").value = formLink;
    document.getElementById("google-meet-link").value = meetLink;
  }

  handleSettingsSubmit() {
    const formLink = document.getElementById("google-form-link").value.trim();
    const meetLink = document.getElementById("google-meet-link").value.trim();

    // Basic URL validation
    if (formLink && !this.isValidUrl(formLink)) {
      this.showSettingsMessage("Please enter a valid Google Form URL", "error");
      return;
    }

    if (meetLink && !this.isValidUrl(meetLink)) {
      this.showSettingsMessage("Please enter a valid Google Meet URL", "error");
      return;
    }

    if (storage.updateGoogleLinks(formLink, meetLink)) {
      this.showSettingsMessage("Settings saved successfully!", "success");
    } else {
      this.showSettingsMessage("Error saving settings", "error");
    }
  }

  resetSettings() {
    ui.confirm(
      "Are you sure you want to reset the Google links to default?",
      () => {
        if (storage.updateGoogleLinks("", "")) {
          this.loadSettings();
          this.showSettingsMessage("Settings reset to default", "success");
        } else {
          this.showSettingsMessage("Error resetting settings", "error");
        }
      },
    );
  }

  showSettingsMessage(message, type) {
    const messageEl = document.getElementById("settings-message");
    messageEl.textContent = message;
    messageEl.className = `settings-message ${type}`;
    messageEl.style.display = "block";

    // Auto-hide after 3 seconds
    setTimeout(() => {
      messageEl.style.display = "none";
    }, 3000);
  }

  isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
      return false;
    }
  }

  // Navigation Methods
  navigateToSection(sectionName) {
    // Add current section to history before navigating
    const currentSection = document.querySelector(".section.active");
    if (currentSection && currentSection.id !== `${sectionName}-section`) {
      this.navigationHistory.push(currentSection.id.replace("-section", ""));
    }

    // Navigate to the new section
    ui.showSection(sectionName);
  }

  goBack() {
    if (this.navigationHistory.length > 0) {
      const previousSection = this.navigationHistory.pop();
      ui.showSection(previousSection);
    } else {
      // Default to dashboard if no history
      ui.showSection("dashboard");
    }
  }

  // Utility Methods
  refreshData() {
    this.updateDashboard();
    this.renderStudents();
    this.renderCommunication();
    ui.showToast("Data refreshed", "success");
  }
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.app = new GemsApp();
});

// Handle online/offline status
window.addEventListener("online", () => {
  ui.showToast("Back online", "success");
});

window.addEventListener("offline", () => {
  ui.showToast("You are offline", "warning");
});
