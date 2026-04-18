// Gems Academy - Main Application
class GemsApp {
  constructor() {
    this.currentEditId = null;
    this.init();
  }

  async init() {
    // Initialize app
    this.setupEventListeners();
    this.updateDashboard();
    this.renderStudents();
    this.renderCommunication();

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
    window.open(
      `https://wa.me/${mobileNumber.replace(/[^\d]/g, "")}?text=${message}`,
      "_blank",
    );
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
      const jsonContent = JSON.stringify(data, null, 2);
      const filename = csvManager.generateFilename("gems_backup", "json");

      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      ui.showToast("All data exported successfully", "success");
    } catch (error) {
      ui.showToast("Error exporting data", "error");
    }
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
