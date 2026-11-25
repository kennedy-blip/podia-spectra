/**
 * PODIA-SPECTRA — Offline-First IndexedDB Vault & Sync Queue (Pure ES2024 JS)
 */

const DB_NAME = 'podia_spectra_vault_v1';
const DB_VERSION = 1;
const STORES = [
	'plantar_arch_scans',
	'tibial_shock_runs',
	'knee_valgus_studies',
	'footwear_midsole_audits',
	'cadence_neuropathy_logs',
	'sync_queue'
];

function openDb() {
	return new Promise((resolve, reject) => {
		if (typeof indexedDB === 'undefined') {
			reject(new Error('IndexedDB unavailable'));
			return;
		}
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onupgradeneeded = () => {
			const db = req.result;
			for (const store of STORES) {
				if (!db.objectStoreNames.contains(store)) {
					db.createObjectStore(store, { keyPath: 'id', autoIncrement: true });
				}
			}
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

export async function saveBiomechanicsRecord(storeName, payload) {
	const record = {
		...payload,
		timestamp: new Date().toISOString(),
		synced: false
	};
	try {
		const db = await openDb();
		return await new Promise((resolve, reject) => {
			const tx = db.transaction([storeName, 'sync_queue'], 'readwrite');
			tx.objectStore(storeName).add(record);
			tx.objectStore('sync_queue').add({ storeName, record, queuedAt: record.timestamp });
			tx.oncomplete = () => resolve(record);
			tx.onerror = () => reject(tx.error);
		});
	} catch {
		return record;
	}
}

export async function getSyncQueueCount() {
	try {
		const db = await openDb();
		return await new Promise((resolve) => {
			const tx = db.transaction('sync_queue', 'readonly');
			const req = tx.objectStore('sync_queue').count();
			req.onsuccess = () => resolve(req.result || 0);
			req.onerror = () => resolve(0);
		});
	} catch {
		return 0;
	}
}

export async function flushSyncQueue() {
	try {
		const db = await openDb();
		const items = await new Promise((resolve) => {
			const tx = db.transaction('sync_queue', 'readonly');
			const req = tx.objectStore('sync_queue').getAll();
			req.onsuccess = () => resolve(req.result || []);
			req.onerror = () => resolve([]);
		});

		if (items.length === 0) return { synced: 0 };

		await fetch('/api/podia_biomechanics_solver', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ batch: items })
		}).catch(() => null);

		await new Promise((resolve) => {
			const tx = db.transaction('sync_queue', 'readwrite');
			tx.objectStore('sync_queue').clear();
			tx.oncomplete = () => resolve();
		});

		return { synced: items.length };
	} catch {
		return { synced: 0 };
	}
}
