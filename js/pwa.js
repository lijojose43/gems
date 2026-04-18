// Gems Academy - PWA Functionality
class PWAManager {
    constructor() {
        this.isServiceWorkerSupported = 'serviceWorker' in navigator;
        this.isIndexedDBSupported = 'indexedDB' in window;
        this.init();
    }

    init() {
        if (this.isServiceWorkerSupported) {
            this.registerServiceWorker();
        }
        
        this.setupConnectionMonitoring();
        this.setupBackgroundSync();
    }

    // Service Worker Registration
    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdateNotification();
                    }
                });
            });
            
            return registration;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return null;
        }
    }

    // Update Notification
    showUpdateNotification() {
        const updateBanner = document.createElement('div');
        updateBanner.className = 'update-banner';
        updateBanner.innerHTML = `
            <div class="update-banner-content">
                <span>A new version is available</span>
                <button id="update-btn" class="btn btn-primary">Update</button>
                <button id="dismiss-update" class="btn-icon">&times;</button>
            </div>
        `;
        
        document.body.appendChild(updateBanner);
        
        document.getElementById('update-btn').addEventListener('click', () => {
            this.updateApp();
            updateBanner.remove();
        });
        
        document.getElementById('dismiss-update').addEventListener('click', () => {
            updateBanner.remove();
        });
    }

    async updateApp() {
        if (!navigator.serviceWorker.controller) return;
        
        ui.showToast('Updating app...', 'info');
        
        // Tell the service worker to skip waiting
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        
        // Reload the page
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    // Connection Monitoring
    setupConnectionMonitoring() {
        const updateConnectionStatus = () => {
            const isOnline = navigator.onLine;
            const statusIndicator = document.createElement('div');
            statusIndicator.className = `connection-status ${isOnline ? 'online' : 'offline'}`;
            statusIndicator.innerHTML = isOnline ? '🟢' : '🔴';
            
            // Remove existing indicator
            const existing = document.querySelector('.connection-status');
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

        window.addEventListener('online', updateConnectionStatus);
        window.addEventListener('offline', updateConnectionStatus);
        
        // Initial status
        updateConnectionStatus();
    }

    // Background Sync
    setupBackgroundSync() {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            // Register for background sync
            this.registerBackgroundSync();
        }
    }

    async registerBackgroundSync() {
        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Register sync tags
            await registration.sync.register('sync-students');
            await registration.sync.register('sync-communication');
            
            console.log('Background sync registered');
        } catch (error) {
            console.log('Background sync not supported:', error);
        }
    }

    // Caching Strategies
    async cacheData(url, data) {
        if (!('caches' in window)) return false;
        
        try {
            const cache = await caches.open('gems-data-cache');
            await cache.put(url, new Response(JSON.stringify(data)));
            return true;
        } catch (error) {
            console.error('Error caching data:', error);
            return false;
        }
    }

    async getCachedData(url) {
        if (!('caches' in window)) return null;
        
        try {
            const cache = await caches.open('gems-data-cache');
            const response = await cache.match(url);
            
            if (response) {
                return await response.json();
            }
            
            return null;
        } catch (error) {
            console.error('Error getting cached data:', error);
            return null;
        }
    }

    // Install Prompt Management
    async checkInstallability() {
        if (!('BeforeInstallPromptEvent' in window)) {
            return false;
        }
        
        // Check if app is already installed
        const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
        return !isInstalled;
    }

    // Share API
    async shareStudent(student) {
        if (!navigator.share) {
            ui.showToast('Web Share API not supported', 'warning');
            return;
        }

        try {
            const shareData = {
                title: `${student.name} - Gems Academy`,
                text: `Student: ${student.name}\nClass: ${student.class}\nSchool: ${student.school}\nMobile: ${student.mobile1}`,
                url: window.location.href
            };

            await navigator.share(shareData);
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error sharing:', error);
                ui.showToast('Error sharing student information', 'error');
            }
        }
    }

    // Storage Quota Management
    async checkStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                const usagePercentage = (estimate.usage / estimate.quota) * 100;
                
                if (usagePercentage > 80) {
                    ui.showToast('Storage almost full. Consider exporting and clearing old data.', 'warning');
                }
                
                return {
                    used: estimate.usage,
                    quota: estimate.quota,
                    usagePercentage
                };
            } catch (error) {
                console.error('Error checking storage quota:', error);
            }
        }
        
        return null;
    }

    // Network Information
    getNetworkInfo() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
        }
        
        return null;
    }

    // Wake Lock
    async requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                const wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake Lock active');
                
                // Release when document is hidden
                document.addEventListener('visibilitychange', async () => {
                    if (document.visibilityState === 'hidden' && wakeLock) {
                        await wakeLock.release();
                        console.log('Wake Lock released');
                    }
                });
                
                return wakeLock;
            } catch (error) {
                console.error('Error requesting Wake Lock:', error);
            }
        }
        
        return null;
    }

    // Screen Orientation
    lockScreenOrientation() {
        if ('screen' in window && 'orientation' in screen && 'lock' in screen.orientation) {
            screen.orientation.lock('portrait').catch(error => {
                console.log('Screen orientation lock not supported:', error);
            });
        }
    }

    // Badging API
    setBadge(count) {
        if ('setAppBadge' in navigator) {
            navigator.setAppBadge(count).catch(error => {
                console.log('Badge API not supported:', error);
            });
        }
    }

    clearBadge() {
        if ('clearAppBadge' in navigator) {
            navigator.clearAppBadge().catch(error => {
                console.log('Badge API not supported:', error);
            });
        }
    }

    // Notification API
    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                ui.showToast('Notifications enabled', 'success');
                return true;
            } else {
                ui.showToast('Notifications denied', 'warning');
                return false;
            }
        }
        
        return false;
    }

    showNotification(title, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                icon: '/assets/icons/icon-192x192.png',
                badge: '/assets/icons/badge-72x72.png',
                tag: 'gems-academy',
                renotify: true,
                ...options
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
        if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0];
            
            if (navigation) {
                const metrics = {
                    loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    firstPaint: performance.getEntriesByType('paint')[0]?.startTime,
                    firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime
                };

                console.log('Performance metrics:', metrics);
                return metrics;
            }
        }
        
        return null;
    }

    // PWA Features Detection
    detectPWAFeatures() {
        const features = {
            serviceWorker: 'serviceWorker' in navigator,
            manifest: 'onbeforeinstallprompt' in window,
            share: 'share' in navigator,
            notifications: 'Notification' in window,
            wakeLock: 'wakeLock' in navigator,
            screenOrientation: 'orientation' in screen,
            badge: 'setAppBadge' in navigator,
            storageEstimate: 'storage' in navigator && 'estimate' in navigator.storage,
            backgroundSync: 'serviceWorker' in navigator && 'SyncManager' in window
        };

        console.log('PWA Features detected:', features);
        return features;
    }
}

// Global PWA manager instance
const pwa = new PWAManager();
