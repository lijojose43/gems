// Gems Academy - PWA Functionality
class PWAManager {
  constructor() {
    this.isServiceWorkerSupported = "serviceWorker" in navigator;
    this.isIndexedDBSupported = "indexedDB" in window;
    this.deferredPrompt = null;
    this.init();
  }

  init() {
    if (this.isServiceWorkerSupported) {
      this.registerServiceWorker();
    }

    this.setupInstallPrompt();
    this.setupConnectionMonitoring();
    this.setupBackgroundSync();
  }

  // Install Prompt Setup
  setupInstallPrompt() {
    // Listen for beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", (e) => {
      console.log("Install prompt event fired");
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    // Listen for app installed event
    window.addEventListener("appinstalled", () => {
      console.log("App installed successfully");
      this.hideInstallButton();
      ui.showToast("Gems Academy installed successfully!", "success");
    });

    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      console.log("App is already installed");
      this.hideInstallButton();
    }
  }

  // Show Install Button
  showInstallButton() {
    // Remove existing install button if any
    const existingBtn = document.getElementById("install-app-btn");
    if (existingBtn) existingBtn.remove();

    const installBtn = document.createElement("button");
    installBtn.id = "install-app-btn";
    installBtn.className = "btn btn-primary install-btn";
    installBtn.innerHTML = `
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      Install App
    `;

    installBtn.addEventListener("click", () => this.installApp());

    // Add to header actions
    const headerActions = document.querySelector(".header-actions");
    if (headerActions) {
      headerActions.appendChild(installBtn);
    }
  }

  // Hide Install Button
  hideInstallButton() {
    const installBtn = document.getElementById("install-app-btn");
    if (installBtn) {
      installBtn.remove();
    }
  }

  // Install App
  async installApp() {
    if (!this.deferredPrompt) {
      ui.showToast("Install not available", "warning");
      return;
    }

    try {
      // Show the install prompt
      this.deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);

      // Clear the deferred prompt
      this.deferredPrompt = null;

      if (outcome === "accepted") {
        ui.showToast("Installing Gems Academy...", "info");
      } else {
        ui.showToast("Install cancelled", "info");
      }
    } catch (error) {
      console.error("Error during install:", error);
      ui.showToast("Error installing app", "error");
    }
  }

  // Service Worker Registration
  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered:", registration);

      // Check for updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            this.showUpdateNotification();
          }
        });
      });

      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return null;
    }
  }

  // Update Notification
  showUpdateNotification() {
    const updateBanner = document.createElement("div");
    updateBanner.className = "update-banner";
    updateBanner.innerHTML = `
            <div class="update-banner-content">
                <span>A new version is available</span>
                <button id="update-btn" class="btn btn-primary">Update</button>
                <button id="dismiss-update" class="btn-icon">&times;</button>
            </div>
        `;

    document.body.appendChild(updateBanner);

    document.getElementById("update-btn").addEventListener("click", () => {
      this.updateApp();
      updateBanner.remove();
    });

    document.getElementById("dismiss-update").addEventListener("click", () => {
      updateBanner.remove();
    });
  }

  async updateApp() {
    if (!navigator.serviceWorker.controller) return;

    ui.showToast("Updating app...", "info");

    // Tell the service worker to skip waiting
    navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });

    // Reload the page
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  // Connection Monitoring
  setupConnectionMonitoring() {
    const updateConnectionStatus = () => {
      const isOnline = navigator.onLine;
      const statusIndicator = document.createElement("div");
      statusIndicator.className = `connection-status ${isOnline ? "online" : "offline"}`;
      statusIndicator.innerHTML = isOnline ? "🟢" : "🔴";

      // Remove existing indicator
      const existing = document.querySelector(".connection-status");
      if (existing) {
        existing.remove();
      }

      // Add new indicator
      document.body.appendChild(statusIndicator);

      // Auto-hide after 3 seconds
      setTimeout(() => {
        statusIndicator.remove();
      }, 3000);
    };

    window.addEventListener("online", updateConnectionStatus);
    window.addEventListener("offline", updateConnectionStatus);

    // Initial status
    updateConnectionStatus();
  }

  // Background Sync
  setupBackgroundSync() {
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      // Register for background sync
      this.registerBackgroundSync();
    }
  }

  async registerBackgroundSync() {
    try {
      const registration = await navigator.serviceWorker.ready;

      // Register sync tags
      await registration.sync.register("sync-students");
      await registration.sync.register("sync-communication");

      console.log("Background sync registered");
    } catch (error) {
      console.log("Background sync not supported:", error);
    }
  }

  // Caching Strategies
  async cacheData(url, data) {
    if (!("caches" in window)) return false;

    try {
      const cache = await caches.open("gems-data-cache");
      await cache.put(url, new Response(JSON.stringify(data)));
      return true;
    } catch (error) {
      console.error("Error caching data:", error);
      return false;
    }
  }

  async getCachedData(url) {
    if (!("caches" in window)) return null;

    try {
      const cache = await caches.open("gems-data-cache");
      const response = await cache.match(url);

      if (response) {
        return await response.json();
      }

      return null;
    } catch (error) {
      console.error("Error getting cached data:", error);
      return null;
    }
  }

  // Install Prompt Management
  async checkInstallability() {
    if (!("BeforeInstallPromptEvent" in window)) {
      return false;
    }

    // Check if app is already installed
    const isInstalled = window.matchMedia("(display-mode: standalone)").matches;
    return !isInstalled;
  }

  // Share API
  async shareStudent(student) {
    if (!navigator.share) {
      ui.showToast("Web Share API not supported", "warning");
      return;
    }

    try {
      const shareData = {
        title: `${student.name} - Gems Academy`,
        text: `Student: ${student.name}\nClass: ${student.class}\nSchool: ${student.school}\nMobile: ${student.mobile1}`,
        url: window.location.href,
      };

      await navigator.share(shareData);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error sharing:", error);
        ui.showToast("Error sharing student information", "error");
      }
    }
  }

  // Storage Quota Management
  async checkStorageQuota() {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const usagePercentage = (estimate.usage / estimate.quota) * 100;

        if (usagePercentage > 80) {
          ui.showToast(
            "Storage almost full. Consider exporting and clearing old data.",
            "warning",
          );
        }

        return {
          used: estimate.usage,
          quota: estimate.quota,
          usagePercentage,
        };
      } catch (error) {
        console.error("Error checking storage quota:", error);
      }
    }

    return null;
  }

  // Network Information
  getNetworkInfo() {
    if ("connection" in navigator) {
      const connection = navigator.connection;

      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      };
    }

    return null;
  }

  // Wake Lock
  async requestWakeLock() {
    if ("wakeLock" in navigator) {
      try {
        const wakeLock = await navigator.wakeLock.request("screen");
        console.log("Wake Lock active");

        // Release when document is hidden
        document.addEventListener("visibilitychange", async () => {
          if (document.visibilityState === "hidden" && wakeLock) {
            await wakeLock.release();
            console.log("Wake Lock released");
          }
        });

        return wakeLock;
      } catch (error) {
        console.error("Error requesting Wake Lock:", error);
      }
    }

    return null;
  }

  // Screen Orientation
  lockScreenOrientation() {
    if (
      "screen" in window &&
      "orientation" in screen &&
      "lock" in screen.orientation
    ) {
      screen.orientation.lock("portrait").catch((error) => {
        console.log("Screen orientation lock not supported:", error);
      });
    }
  }

  // Badging API
  setBadge(count) {
    if ("setAppBadge" in navigator) {
      navigator.setAppBadge(count).catch((error) => {
        console.log("Badge API not supported:", error);
      });
    }
  }

  clearBadge() {
    if ("clearAppBadge" in navigator) {
      navigator.clearAppBadge().catch((error) => {
        console.log("Badge API not supported:", error);
      });
    }
  }

  // Notification API
  async requestNotificationPermission() {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        ui.showToast("Notifications enabled", "success");
        return true;
      } else {
        ui.showToast("Notifications denied", "warning");
        return false;
      }
    }

    return false;
  }

  showNotification(title, options = {}) {
    if ("Notification" in window && Notification.permission === "granted") {
      const notification = new Notification(title, {
        icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxNTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MiIgaGVpZ2h0PSIxNTIiIHJ4PSIyMCIgZmlsbD0iIzYzNjZmMSIvPjxwYXRoIGQ9Ik03NiAzOEwxMDAgNjBIMTQ0TDc2IDEyMEw4IDYwSDMyTDc2IDM4WiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=",
        badge:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCA3MiA3MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHJ4PSIxMiIgZmlsbD0iIzYzNjZmMSIvPjxwYXRoIGQ9Ik0zNiAxOEw0OCAyNkg1NkwzNiAzNkw0OCA0OEgzNkwyNkg0OEgzNlYxOFoiIGZpbGw9IndoaXRlIi8+PC9zdmc+",
        tag: "gems-academy",
        renotify: true,
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    }

    return null;
  }

  // Performance Monitoring
  measurePerformance() {
    if ("performance" in window) {
      const navigation = performance.getEntriesByType("navigation")[0];

      if (navigation) {
        const metrics = {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded:
            navigation.domContentLoadedEventEnd -
            navigation.domContentLoadedEventStart,
          firstPaint: performance.getEntriesByType("paint")[0]?.startTime,
          firstContentfulPaint:
            performance.getEntriesByType("paint")[1]?.startTime,
        };

        console.log("Performance metrics:", metrics);
        return metrics;
      }
    }

    return null;
  }

  // PWA Features Detection
  detectPWAFeatures() {
    const features = {
      serviceWorker: "serviceWorker" in navigator,
      manifest: "onbeforeinstallprompt" in window,
      share: "share" in navigator,
      notifications: "Notification" in window,
      wakeLock: "wakeLock" in navigator,
      screenOrientation: "orientation" in screen,
      badge: "setAppBadge" in navigator,
      storageEstimate:
        "storage" in navigator && "estimate" in navigator.storage,
      backgroundSync: "serviceWorker" in navigator && "SyncManager" in window,
    };

    console.log("PWA Features detected:", features);
    return features;
  }
}

// Global PWA manager instance
const pwa = new PWAManager();
