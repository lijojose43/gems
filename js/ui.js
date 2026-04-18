// Gems Academy - UI Management
class UIManager {
  constructor() {
    this.currentSection = "dashboard";
    this.currentTheme = "system";
    this.init();
  }

  init() {
    this.setupTheme();
    this.setupNavigation();
    this.setupModals();
    this.setupToasts();
    this.setupSearch();
    this.setupFileUpload();
  }

  // Theme Management
  setupTheme() {
    const savedTheme = storage.getSettings().theme || "system";
    this.setTheme(savedTheme);

    document.getElementById("theme-toggle").addEventListener("click", () => {
      this.toggleTheme();
    });
  }

  setTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    storage.updateSetting("theme", theme);

    const themeIcon = document.querySelector("#theme-toggle .icon");
    if (theme === "dark") {
      themeIcon.textContent = "☀️";
    } else if (theme === "light") {
      themeIcon.textContent = "🌙";
    } else {
      themeIcon.textContent = "🌓";
    }
  }

  toggleTheme() {
    const themes = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }

  // Navigation
  setupNavigation() {
    // Desktop navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        this.showSection(section);
      });
    });

    // Mobile navigation
    document.querySelectorAll(".mobile-nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        this.showSection(section);
      });
    });
  }

  showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll(".section").forEach((section) => {
      section.classList.remove("active");
    });

    // Show target section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
      targetSection.classList.add("active");
      this.currentSection = sectionName;
    }

    // Update navigation states
    document.querySelectorAll(".nav-link, .mobile-nav-link").forEach((link) => {
      link.classList.remove("active");
      if (link.dataset.section === sectionName) {
        link.classList.add("active");
      }
    });

    // Update page title
    this.updatePageTitle(sectionName);
  }

  updatePageTitle(section) {
    const titles = {
      dashboard: "Dashboard",
      students: "Students",
      communication: "Communication",
      "import-export": "Import/Export",
    };

    document.title = `Gems Academy - ${titles[section] || "Student Management"}`;
  }

  // Modal Management
  setupModals() {
    // Modal close buttons
    document
      .querySelectorAll(".modal-close, .modal-footer .btn-secondary")
      .forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const modalId =
            e.target.dataset.modal ||
            e.target.closest("[data-modal]").dataset.modal;
          this.closeModal(modalId);
        });
      });

    // Close modal on overlay click
    document.getElementById("modal-overlay").addEventListener("click", (e) => {
      if (e.target.id === "modal-overlay") {
        this.closeModal();
      }
    });

    // Close modal on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal();
      }
    });
  }

  openModal(modalId) {
    const overlay = document.getElementById("modal-overlay");
    const modal = document.getElementById(modalId);

    if (overlay && modal) {
      overlay.classList.add("active");
      modal.classList.add("active");

      // Setup drag-to-dismiss for bottom sheets
      this.setupBottomSheetDrag(modal);

      // Focus first input
      const firstInput = modal.querySelector("input, select, textarea");
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }

  setupBottomSheetDrag(modal) {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    const handleStart = (e) => {
      startY = e.type.includes("mouse") ? e.clientY : e.touches[0].clientY;
      isDragging = true;
      modal.classList.add("dragging");
      modal.style.transition = "none";
    };

    const handleMove = (e) => {
      if (!isDragging) return;

      e.preventDefault();
      currentY = e.type.includes("mouse") ? e.clientY : e.touches[0].clientY;
      const deltaY = currentY - startY;

      if (deltaY > 0) {
        modal.style.transform = `translateY(${deltaY}px)`;
      }
    };

    const handleEnd = () => {
      if (!isDragging) return;

      isDragging = false;
      modal.classList.remove("dragging");
      modal.style.transition = "";

      const deltaY = currentY - startY;
      const threshold = modal.offsetHeight * 0.3;

      if (deltaY > threshold) {
        // Dismiss the modal
        this.closeModal(modal.id);
      } else {
        // Snap back
        modal.style.transform = "";
      }

      startY = 0;
      currentY = 0;
    };

    // Add event listeners for touch and mouse
    modal.addEventListener("touchstart", handleStart, { passive: true });
    modal.addEventListener("mousedown", handleStart);
    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("touchend", handleEnd);
    document.addEventListener("mouseup", handleEnd);

    // Clean up event listeners when modal is closed
    const cleanup = () => {
      modal.removeEventListener("touchstart", handleStart);
      modal.removeEventListener("mousedown", handleStart);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("touchend", handleEnd);
      document.removeEventListener("mouseup", handleEnd);
      modal.style.transform = "";
    };

    // Store cleanup function for later use
    modal._dragCleanup = cleanup;
  }

  closeModal(modalId = null) {
    const overlay = document.getElementById("modal-overlay");

    if (modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove("active");
        // Clean up drag event listeners
        if (modal._dragCleanup) {
          modal._dragCleanup();
          delete modal._dragCleanup;
        }
      }
    } else {
      // Close all modals
      document.querySelectorAll(".modal").forEach((modal) => {
        modal.classList.remove("active");
        // Clean up drag event listeners
        if (modal._dragCleanup) {
          modal._dragCleanup();
          delete modal._dragCleanup;
        }
      });
    }

    overlay.classList.remove("active");
  }

  // Toast Notifications
  setupToasts() {
    // Toast container is created dynamically
  }

  showToast(message, type = "info", duration = 3000) {
    const container = document.getElementById("toast-container");

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icon =
      {
        success: "✅",
        error: "❌",
        warning: "⚠️",
        info: "ℹ️",
      }[type] || "ℹ️";

    toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        `;

    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      toast.style.animation = "toastSlideOut 0.3s ease forwards";
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  // Search Functionality
  setupSearch() {
    const searchInput = document.getElementById("student-search");
    if (searchInput) {
      let searchTimeout;

      searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.handleSearch(e.target.value);
        }, 300);
      });
    }
  }

  handleSearch(query) {
    if (this.currentSection === "students") {
      app.renderStudents(query);
    }
  }

  // File Upload
  setupFileUpload() {
    const uploadArea = document.getElementById("csv-upload-area");
    const fileInput = document.getElementById("csv-file-input");

    if (uploadArea && fileInput) {
      // Drag and drop
      uploadArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadArea.classList.add("dragover");
      });

      uploadArea.addEventListener("dragleave", () => {
        uploadArea.classList.remove("dragover");
      });

      uploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadArea.classList.remove("dragover");

        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.handleFileSelect(files[0]);
        }
      });

      // Click to browse
      fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
          this.handleFileSelect(e.target.files[0]);
        }
      });
    }
  }

  async handleFileSelect(file) {
    try {
      this.showLoading("Reading file...");

      const csvContent = await csvManager.readCSVFile(file);
      const result = csvManager.importStudents(csvContent);

      if (result.errors.length > 0) {
        this.showToast(
          `Imported ${result.students.length} students with ${result.errors.length} errors`,
          "warning",
        );
        console.warn("Import errors:", result.errors);
      } else {
        this.showToast(
          `Successfully imported ${result.students.length} students`,
          "success",
        );
      }

      // Add students to storage
      result.students.forEach((student) => {
        storage.addStudent(student);
      });

      // Refresh students view
      if (this.currentSection === "students") {
        app.renderStudents();
      }

      // Update dashboard stats
      app.updateDashboard();
    } catch (error) {
      this.showToast(`Error importing file: ${error.message}`, "error");
    } finally {
      this.hideLoading();
    }
  }

  // Loading States
  showLoading(message = "Loading...") {
    const overlay = document.getElementById("loading-overlay");
    const loadingText = overlay.querySelector(".loading-text");

    loadingText.textContent = message;
    overlay.classList.add("active");
  }

  hideLoading() {
    document.getElementById("loading-overlay").classList.remove("active");
  }

  // Form Helpers
  clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
      form.reset();
    }
  }

  populateForm(formId, data) {
    const form = document.getElementById(formId);
    if (!form) return;

    Object.keys(data).forEach((key) => {
      const field = form.querySelector(`[name="${key}"]`);
      if (field) {
        // Handle remarks array specially
        if (key === "remarks" && Array.isArray(data[key])) {
          // Get the most recent remark text
          const latestRemark = data[key][data[key].length - 1];
          field.value = latestRemark ? latestRemark.remark : "";
        } else {
          field.value = data[key] || "";
        }
      }
    });
  }

  getFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return {};

    const formData = new FormData(form);
    const data = {};

    formData.forEach((value, key) => {
      data[key] = value;
    });

    return data;
  }

  validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return { isValid: true, errors: [] };

    const requiredFields = form.querySelectorAll("[required]");
    const errors = [];

    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        errors.push(`${field.name || field.id} is required`);
        field.classList.add("error");
      } else {
        field.classList.remove("error");
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // UI Rendering Helpers
  createStudentCard(student) {
    const card = document.createElement("div");
    card.className = "student-card";
    card.dataset.studentId = student.id;

    const remarksText =
      student.remarks && student.remarks.length > 0
        ? student.remarks[student.remarks.length - 1].remark
        : "No remarks";

    card.innerHTML = `
            <div class="student-card-header">
                <h3 class="student-name">${this.escapeHtml(student.name)}</h3>
                <div class="student-actions">
                    <button class="btn-icon" onclick="app.callStudent('${student.mobile1}')" title="Call">
                        📞
                    </button>
                    <button class="btn-icon" onclick="app.whatsappStudent('${student.mobile1}')" title="WhatsApp">
                        💬
                    </button>
                    <button class="btn-icon" onclick="app.editStudent('${student.id}')" title="Edit">
                        ✏️
                    </button>
                    <button class="btn-icon" onclick="app.deleteStudent('${student.id}')" title="Delete">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="student-info">
                <div class="info-item">
                    <strong>Class:</strong> ${this.escapeHtml(student.class)}
                </div>
                <div class="info-item">
                    <strong>School:</strong> ${this.escapeHtml(student.school)}
                </div>
                <div class="info-item">
                    <strong>Place:</strong> ${this.escapeHtml(student.place)}
                </div>
                <div class="info-item">
                    <strong>Mobile:</strong> ${this.escapeHtml(student.mobile1)}
                </div>
                <div class="info-item">
                    <strong>Joined:</strong> ${this.escapeHtml(student.gemsJoiningYear)}
                </div>
                <div class="info-item">
                    <strong>Last Remark:</strong> ${this.escapeHtml(remarksText)}
                </div>
            </div>
        `;

    return card;
  }

  createCommunicationItem(log, studentName) {
    const item = document.createElement("div");
    item.className = "communication-item";

    const typeIcon =
      {
        call: "📞",
        whatsapp: "💬",
        meeting: "🤝",
      }[log.type] || "📝";

    item.innerHTML = `
            <div class="communication-header">
                <span class="communication-type">
                    ${typeIcon} ${log.type.charAt(0).toUpperCase() + log.type.slice(1)}
                </span>
                <span class="communication-date">
                    ${this.formatDate(log.date)} at ${log.time}
                </span>
            </div>
            <div class="communication-content">
                <h4>${this.escapeHtml(studentName)}</h4>
                ${log.duration ? `<p><strong>Duration:</strong> ${this.escapeHtml(log.duration)}</p>` : ""}
                <p>${this.escapeHtml(log.notes)}</p>
            </div>
        `;

    return item;
  }

  createActivityItem(activity) {
    const item = document.createElement("div");
    item.className = "activity-item";

    const typeIcon =
      {
        call: "📞",
        whatsapp: "💬",
        meeting: "🤝",
        student_added: "👤",
        student_updated: "✏️",
      }[activity.type] || "📝";

    item.innerHTML = `
            <div class="activity-icon">${typeIcon}</div>
            <div class="activity-content">
                <div class="activity-text">${this.escapeHtml(activity.description)}</div>
                <div class="activity-time">${this.formatRelativeTime(activity.date)}</div>
            </div>
        `;

    return item;
  }

  // Utility Functions
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  formatDate(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  formatRelativeTime(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  formatNumber(num) {
    return new Intl.NumberFormat("en-US").format(num);
  }

  // Confirmation Dialogs
  confirm(message, callback) {
    if (confirm(message)) {
      callback();
    }
  }

  // Responsive Helpers
  isMobile() {
    return window.innerWidth <= 768;
  }

  isTablet() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
  }

  isDesktop() {
    return window.innerWidth > 1024;
  }
}

// Global UI manager instance
const ui = new UIManager();
