/**
 * Offline Manager
 * Handles offline data storage and synchronization
 */

class OfflineManager {
    constructor() {
        this.dbName = 'SurveyPlatformOffline';
        this.dbVersion = 1;
        this.db = null;
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;

        this.init();
    }

    async init() {
        await this.openDatabase();
        this.setupEventListeners();
        this.updateOnlineStatus();

        // Try to sync on startup if online
        if (this.isOnline) {
            this.syncPendingResponses();
        }
    }

    /**
     * Open IndexedDB database
     */
    openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✓ IndexedDB opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Store for pending survey responses
                if (!db.objectStoreNames.contains('pendingResponses')) {
                    const responseStore = db.createObjectStore('pendingResponses', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    responseStore.createIndex('surveyCode', 'surveyCode', { unique: false });
                    responseStore.createIndex('timestamp', 'timestamp', { unique: false });
                    responseStore.createIndex('synced', 'synced', { unique: false });
                }

                // Store for cached surveys
                if (!db.objectStoreNames.contains('cachedSurveys')) {
                    const surveyStore = db.createObjectStore('cachedSurveys', {
                        keyPath: 'survey_code'
                    });
                    surveyStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
                }

                // Store for sync queue
                if (!db.objectStoreNames.contains('syncQueue')) {
                    const syncStore = db.createObjectStore('syncQueue', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    syncStore.createIndex('timestamp', 'timestamp', { unique: false });
                    syncStore.createIndex('status', 'status', { unique: false });
                }

                console.log('✓ IndexedDB schema created');
            };
        });
    }

    /**
     * Setup online/offline event listeners
     */
    setupEventListeners() {
        window.addEventListener('online', () => {
            console.log('✓ Connection restored');
            this.isOnline = true;
            this.updateOnlineStatus();
            this.syncPendingResponses();
        });

        window.addEventListener('offline', () => {
            console.log('⚠ Connection lost - working offline');
            this.isOnline = false;
            this.updateOnlineStatus();
        });
    }

    /**
     * Update UI online status indicator
     */
    updateOnlineStatus() {
        const statusIndicator = document.getElementById('onlineStatus');
        if (!statusIndicator) return;

        if (this.isOnline) {
            statusIndicator.innerHTML = '🟢 En ligne';
            statusIndicator.className = 'status-online';
        } else {
            statusIndicator.innerHTML = '🔴 Hors ligne';
            statusIndicator.className = 'status-offline';
        }

        // Check for pending data
        this.getPendingCount().then(count => {
            if (count > 0) {
                const pendingIndicator = document.getElementById('pendingSync');
                if (pendingIndicator) {
                    pendingIndicator.innerHTML = `📤 ${count} réponse${count > 1 ? 's' : ''} en attente`;
                    pendingIndicator.style.display = 'block';
                }
            }
        });
    }

    /**
     * Cache survey data for offline access
     */
    async cacheSurvey(surveyCode, surveyData) {
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cachedSurveys'], 'readwrite');
            const store = transaction.objectStore('cachedSurveys');

            const cacheData = {
                survey_code: surveyCode,
                data: surveyData,
                lastUpdated: Date.now()
            };

            const request = store.put(cacheData);

            request.onsuccess = () => {
                console.log(`✓ Survey ${surveyCode} cached for offline use`);
                resolve();
            };

            request.onerror = () => {
                console.error('Error caching survey:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get cached survey data
     */
    async getCachedSurvey(surveyCode) {
        if (!this.db) return null;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cachedSurveys'], 'readonly');
            const store = transaction.objectStore('cachedSurveys');
            const request = store.get(surveyCode);

            request.onsuccess = () => {
                const result = request.result;
                if (result) {
                    console.log(`✓ Loaded survey ${surveyCode} from cache`);
                    resolve(result.data);
                } else {
                    resolve(null);
                }
            };

            request.onerror = () => {
                console.error('Error getting cached survey:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Save survey response locally
     */
    async savePendingResponse(surveyCode, respondentUuid, responses, demographics, isComplete = false) {
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['pendingResponses'], 'readwrite');
            const store = transaction.objectStore('pendingResponses');

            const responseData = {
                surveyCode,
                respondentUuid,
                responses,
                demographics,
                isComplete,
                timestamp: Date.now(),
                synced: false
            };

            const request = store.add(responseData);

            request.onsuccess = () => {
                const id = request.result;
                console.log(`✓ Response saved locally (ID: ${id})`);
                this.updateOnlineStatus();
                resolve(id);
            };

            request.onerror = () => {
                console.error('Error saving response:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get all pending responses
     */
    async getPendingResponses() {
        if (!this.db) return [];

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['pendingResponses'], 'readonly');
            const store = transaction.objectStore('pendingResponses');
            const index = store.index('synced');
            const request = index.getAll(false);

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                console.error('Error getting pending responses:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get count of pending responses
     */
    async getPendingCount() {
        if (!this.db) return 0;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['pendingResponses'], 'readonly');
            const store = transaction.objectStore('pendingResponses');
            const index = store.index('synced');
            const request = index.count(false);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Mark response as synced
     */
    async markAsSynced(responseId) {
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['pendingResponses'], 'readwrite');
            const store = transaction.objectStore('pendingResponses');
            const request = store.get(responseId);

            request.onsuccess = () => {
                const data = request.result;
                if (data) {
                    data.synced = true;
                    data.syncedAt = Date.now();
                    const updateRequest = store.put(data);

                    updateRequest.onsuccess = () => {
                        console.log(`✓ Response ${responseId} marked as synced`);
                        resolve();
                    };

                    updateRequest.onerror = () => {
                        reject(updateRequest.error);
                    };
                } else {
                    resolve();
                }
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Sync all pending responses to server
     */
    async syncPendingResponses() {
        if (!this.isOnline || this.syncInProgress) {
            return;
        }

        this.syncInProgress = true;
        console.log('🔄 Starting sync...');

        try {
            const pendingResponses = await this.getPendingResponses();

            if (pendingResponses.length === 0) {
                console.log('✓ No pending responses to sync');
                this.syncInProgress = false;
                return;
            }

            console.log(`📤 Syncing ${pendingResponses.length} response(s)...`);

            let successCount = 0;
            let failCount = 0;

            for (const response of pendingResponses) {
                try {
                    // Submit to server
                    if (response.isComplete) {
                        await api.submitSurvey(
                            response.surveyCode,
                            response.respondentUuid,
                            response.responses,
                            response.demographics
                        );
                    } else {
                        await api.saveProgress(
                            response.surveyCode,
                            response.respondentUuid,
                            response.responses,
                            response.demographics
                        );
                    }

                    // Mark as synced
                    await this.markAsSynced(response.id);
                    successCount++;

                    console.log(`✓ Synced response ${response.id}`);
                } catch (error) {
                    console.error(`✗ Failed to sync response ${response.id}:`, error);
                    failCount++;
                }
            }

            console.log(`✓ Sync complete: ${successCount} succeeded, ${failCount} failed`);

            // Update UI
            this.updateOnlineStatus();

            // Show notification
            if (successCount > 0) {
                this.showNotification(`✓ ${successCount} réponse${successCount > 1 ? 's' : ''} synchronisée${successCount > 1 ? 's' : ''}`);
            }

        } catch (error) {
            console.error('Sync error:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Clear synced responses older than X days
     */
    async clearOldSyncedResponses(daysOld = 7) {
        if (!this.db) return;

        const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['pendingResponses'], 'readwrite');
            const store = transaction.objectStore('pendingResponses');
            const request = store.openCursor();

            let deletedCount = 0;

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const data = cursor.value;
                    if (data.synced && data.syncedAt && data.syncedAt < cutoffTime) {
                        cursor.delete();
                        deletedCount++;
                    }
                    cursor.continue();
                } else {
                    console.log(`✓ Cleaned up ${deletedCount} old synced responses`);
                    resolve(deletedCount);
                }
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Show notification to user
     */
    showNotification(message) {
        const notification = document.getElementById('syncNotification');
        if (notification) {
            notification.textContent = message;
            notification.style.display = 'block';

            setTimeout(() => {
                notification.style.display = 'none';
            }, 5000);
        } else {
            // Fallback to console
            console.log('Notification:', message);
        }
    }

    /**
     * Get offline statistics
     */
    async getOfflineStats() {
        const pending = await this.getPendingCount();
        const cachedSurveysCount = await this.getCachedSurveyCount();

        return {
            pendingResponses: pending,
            cachedSurveys: cachedSurveysCount,
            isOnline: this.isOnline,
            syncInProgress: this.syncInProgress
        };
    }

    /**
     * Get count of cached surveys
     */
    async getCachedSurveyCount() {
        if (!this.db) return 0;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cachedSurveys'], 'readonly');
            const store = transaction.objectStore('cachedSurveys');
            const request = store.count();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }
}

// Create singleton instance
const offlineManager = new OfflineManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = offlineManager;
}
