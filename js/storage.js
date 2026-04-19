// Gems Academy - Storage Management
class StorageManager {
  constructor() {
    this.STORAGE_KEYS = {
      STUDENTS: "gems_students",
      COMMUNICATION: "gems_communication",
      SETTINGS: "gems_settings",
      LAST_BACKUP: "gems_last_backup",
    };
    this.initializeStorage();
  }

  // Initialize storage with default data if empty
  initializeStorage() {
    if (!this.getStudents()) {
      this.setStudents([]);
    }
    if (!this.getCommunication()) {
      this.setCommunication([]);
    }
    if (!this.getSettings()) {
      this.setSettings({
        theme: "light",
        autoBackup: true,
        lastSync: null,
      });
    }
  }

  // Generic storage methods
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error getting data for key ${key}:`, error);
      return null;
    }
  }

  set(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error setting data for key ${key}:`, error);
      return false;
    }
  }

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing data for key ${key}:`, error);
      return false;
    }
  }

  // Student specific methods
  getStudents() {
    return this.get(this.STORAGE_KEYS.STUDENTS) || [];
  }

  setStudents(students) {
    return this.set(this.STORAGE_KEYS.STUDENTS, students);
  }

  addStudent(student) {
    const students = this.getStudents();
    const newStudent = {
      id: this.generateId(),
      ...student,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    students.push(newStudent);
    return this.setStudents(students) ? newStudent : null;
  }

  updateStudent(id, updates) {
    const students = this.getStudents();
    const index = students.findIndex((s) => s.id === id);
    if (index !== -1) {
      students[index] = {
        ...students[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return this.setStudents(students) ? students[index] : null;
    }
    return null;
  }

  deleteStudent(id) {
    const students = this.getStudents();
    const filtered = students.filter((s) => s.id !== id);
    return this.setStudents(filtered);
  }

  getStudent(id) {
    const students = this.getStudents();
    return students.find((s) => s.id === id) || null;
  }

  searchStudents(query) {
    const students = this.getStudents();
    if (!query) return students;

    const searchTerm = query.toLowerCase();
    return students.filter((student) => {
      return Object.values(student).some(
        (value) => value && value.toString().toLowerCase().includes(searchTerm),
      );
    });
  }

  // Communication specific methods
  getCommunication() {
    return this.get(this.STORAGE_KEYS.COMMUNICATION) || [];
  }

  setCommunication(communication) {
    return this.set(this.STORAGE_KEYS.COMMUNICATION, communication);
  }

  addCommunication(log) {
    const communication = this.getCommunication();
    const newLog = {
      id: this.generateId(),
      ...log,
      createdAt: new Date().toISOString(),
    };
    communication.push(newLog);
    return this.setCommunication(communication) ? newLog : null;
  }

  updateCommunication(id, updates) {
    const communication = this.getCommunication();
    const index = communication.findIndex((c) => c.id === id);
    if (index !== -1) {
      communication[index] = {
        ...communication[index],
        ...updates,
      };
      return this.setCommunication(communication) ? communication[index] : null;
    }
    return null;
  }

  deleteCommunication(id) {
    const communication = this.getCommunication();
    const filtered = communication.filter((c) => c.id !== id);
    return this.setCommunication(filtered);
  }

  getCommunicationForStudent(studentId) {
    const communication = this.getCommunication();
    return communication.filter((c) => c.studentId === studentId);
  }

  // Settings methods
  getSettings() {
    return this.get(this.STORAGE_KEYS.SETTINGS) || {};
  }

  setSettings(settings) {
    return this.set(this.STORAGE_KEYS.SETTINGS, settings);
  }

  updateSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    return this.setSettings(settings);
  }

  // Backup and restore methods
  exportData() {
    return {
      students: this.getStudents(),
      communication: this.getCommunication(),
      settings: this.getSettings(),
      exportDate: new Date().toISOString(),
      version: "1.0",
    };
  }

  importData(data) {
    try {
      if (data.students) {
        this.setStudents(data.students);
      }
      if (data.communication) {
        this.setCommunication(data.communication);
      }
      if (data.settings) {
        this.setSettings(data.settings);
      }
      this.updateSetting(
        this.STORAGE_KEYS.LAST_BACKUP,
        new Date().toISOString(),
      );
      return true;
    } catch (error) {
      console.error("Error importing data:", error);
      return false;
    }
  }

  // Statistics methods
  getStats() {
    const students = this.getStudents();
    const communication = this.getCommunication();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentCalls = communication.filter(
      (c) => c.type === "call" && new Date(c.date) >= thirtyDaysAgo,
    ).length;

    const pendingFollowups = communication.filter((c) => {
      const commDate = new Date(c.date);
      const daysSinceContact = Math.floor(
        (now - commDate) / (1000 * 60 * 60 * 24),
      );
      return daysSinceContact > 7; // Consider follow-up needed after 7 days
    }).length;

    const recentActivity = communication
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    return {
      totalStudents: students.length,
      recentCalls,
      pendingFollowups,
      recentActivity,
    };
  }

  // Utility methods
  generateId() {
    return "id_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  clearAllData() {
    try {
      Object.values(this.STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
      this.initializeStorage();
      return true;
    } catch (error) {
      console.error("Error clearing data:", error);
      return false;
    }
  }

  // Storage quota management
  getStorageInfo() {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    return {
      used: totalSize,
      usedFormatted: this.formatBytes(totalSize),
      available: 5 * 1024 * 1024 - totalSize, // Approximate 5MB limit
      availableFormatted: this.formatBytes(5 * 1024 * 1024 - totalSize),
    };
  }

  formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Auto-backup functionality
  autoBackup() {
    const settings = this.getSettings();
    if (settings.autoBackup) {
      const lastBackup = this.get(this.STORAGE_KEYS.LAST_BACKUP);
      const now = new Date();

      if (!lastBackup || now - new Date(lastBackup) > 24 * 60 * 60 * 1000) {
        // Backup if last backup was more than 24 hours ago
        const data = this.exportData();
        this.updateSetting(this.STORAGE_KEYS.LAST_BACKUP, now.toISOString());
        return data;
      }
    }
    return null;
  }
}

// Global storage instance
const storage = new StorageManager();
