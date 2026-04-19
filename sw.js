// Gems Academy - Service Worker
const CACHE_NAME = "gems-academy-v1";
const DATA_CACHE_NAME = "gems-data-v1";

// Assets to cache for offline functionality
const STATIC_CACHE_URLS = [
  "/",
  "/index.html",
  "/css/styles.css",
  "/css/themes.css",
  "/css/responsive.css",
  "/css/pwa-styles.css",
  "/js/storage.js",
  "/js/csv.js",
  "/js/ui.js",
  "/js/app.js",
  "/js/pwa.js",
  "/manifest.json",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching static assets");
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log("Service Worker: Installation complete");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("Service Worker: Installation failed:", error);
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
              console.log("Service Worker: Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        console.log("Service Worker: Activation complete");
        return self.clients.claim();
      }),
  );
});

// Fetch event - serve cached content when offline
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external requests
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Handle different types of requests
  if (url.pathname === "/api/data") {
    // Handle data API requests
    event.respondWith(handleDataRequest(request));
  } else {
    // Handle static asset requests
    event.respondWith(handleStaticRequest(request));
  }
});

// Handle static asset requests
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fetch from network
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log(
      "Service Worker: Network request failed, serving from cache:",
      error,
    );

    // Try to serve from cache even if it's stale
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for HTML requests
    if (request.destination === "document") {
      return caches.match("/");
    }

    // Return error for other requests
    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

// Handle data API requests
async function handleDataRequest(request) {
  try {
    // For data requests, try network first, then cache
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const data = await networkResponse.json();

      // Cache the data
      const cache = await caches.open(DATA_CACHE_NAME);
      const cacheResponse = new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
      cache.put(request, cacheResponse.clone());

      return cacheResponse;
    }

    throw new Error("Network response not ok");
  } catch (error) {
    console.log(
      "Service Worker: Data request failed, serving from cache:",
      error,
    );

    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return empty data structure
    return new Response(
      JSON.stringify({
        students: [],
        communication: [],
        settings: {},
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Background sync
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync triggered:", event.tag);

  if (event.tag === "sync-students") {
    event.waitUntil(syncStudents());
  } else if (event.tag === "sync-communication") {
    event.waitUntil(syncCommunication());
  }
});

// Sync students data
async function syncStudents() {
  try {
    // Get pending student data from IndexedDB
    const pendingStudents = await getPendingData("pending-students");

    for (const student of pendingStudents) {
      try {
        // Try to sync with server (placeholder for actual implementation)
        await syncStudentWithServer(student);

        // Remove from pending queue
        await removePendingData("pending-students", student.id);
      } catch (error) {
        console.error("Error syncing student:", error);
      }
    }

    console.log("Service Worker: Students sync completed");
  } catch (error) {
    console.error("Service Worker: Students sync failed:", error);
  }
}

// Sync communication data
async function syncCommunication() {
  try {
    const pendingCommunication = await getPendingData("pending-communication");

    for (const comm of pendingCommunication) {
      try {
        await syncCommunicationWithServer(comm);
        await removePendingData("pending-communication", comm.id);
      } catch (error) {
        console.error("Error syncing communication:", error);
      }
    }

    console.log("Service Worker: Communication sync completed");
  } catch (error) {
    console.error("Service Worker: Communication sync failed:", error);
  }
}

// Placeholder functions for server sync
async function syncStudentWithServer(student) {
  // This would be implemented with actual server endpoint
  console.log("Syncing student with server:", student);
  return Promise.resolve();
}

async function syncCommunicationWithServer(communication) {
  // This would be implemented with actual server endpoint
  console.log("Syncing communication with server:", communication);
  return Promise.resolve();
}

// IndexedDB helpers for pending data
async function getPendingData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("gems-pending-db", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();

      getAllRequest.onerror = () => reject(getAllRequest.error);
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "id" });
      }
    };
  });
}

async function removePendingData(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("gems-pending-db", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete(id);

      deleteRequest.onerror = () => reject(deleteRequest.error);
      deleteRequest.onsuccess = () => resolve();
    };
  });
}

// Push notifications
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push received");

  const options = {
    body: event.data ? event.data.text() : "New notification from Gems Academy",
    icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxNTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MiIgaGVpZ2h0PSIxNTIiIHJ4PSIyMCIgZmlsbD0iIzYzNjZmMSIvPjxwYXRoIGQ9Ik03NiAzOEwxMDAgNjBIMTQ0TDc2IDEyMEw4IDYwSDMyTDc2IDM4WiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=",
    badge:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCA3MiA3MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHJ4PSIxMiIgZmlsbD0iIzYzNjZmMSIvPjxwYXRoIGQ9Ik0zNiAxOEw0OCAyNkg1NkwzNiAzNkw0OCA0OEgzNkwyNkg0OEgzNlYxOFoiIGZpbGw9IndoaXRlIi8+PC9zdmc+",
    tag: "gems-academy",
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: "open",
        title: "Open App",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification("Gems Academy", options));
});

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked");
  console.log("Service Worker: Notification clicked");

  event.notification.close();

  if (event.action === "open" || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === self.location.origin && "focus" in client) {
            return client.focus();
          }
        }

        // Open new window
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      }),
    );
  }
});

// Message handling
self.addEventListener("message", (event) => {
  console.log("Service Worker: Message received:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Cache cleanup on storage pressure
self.addEventListener("quotaexceeded", (event) => {
  console.log("Service Worker: Storage quota exceeded");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Delete oldest data cache first
      const dataCaches = cacheNames.filter((name) => name.includes("data"));
      if (dataCaches.length > 0) {
        return caches.delete(dataCaches[0]);
      }
    }),
  );
});

// Network status monitoring
self.addEventListener("online", () => {
  console.log("Service Worker: Client is online");

  // Trigger sync when coming back online
  self.registration.sync.register("sync-students");
  self.registration.sync.register("sync-communication");
});

self.addEventListener("offline", () => {
  console.log("Service Worker: Client is offline");
});
