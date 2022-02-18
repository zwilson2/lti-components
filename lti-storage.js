export class LtiStorage {
	constructor(checkLtiStorageLimitFlag = true) {
		this._checkLtiStorageLimitFlag = checkLtiStorageLimitFlag;
		this._sizeLimit = 4096;
		this._keyLimit = 500;
		this._storage = {};
	}

	delete(origin, key) {
		this.tryPut(origin, key, null);
	}

	get(origin, key) {
		const store = this._storage[origin];

		if (!store || !(key in store)) {
			return null;
		}

		return store[key];
	}

	getStore(origin) {
		const store = this._storage[origin];
		return store;
	}

	reachedStorageLimit(origin) {
		return this._reachedStorageLimit(this._storage[origin]);
	}

	tryPut(origin, key, value) {
		if (value === null || value === undefined) {
			this._storage[origin] && delete this._storage[origin][key];
			return true;
		}
		if (!this._storage[origin]) {
			this._storage[origin] = {};
		}
		const store = this._storage[origin];
		if (this._checkLtiStorageLimitFlag) {
			if (this._reachedStorageLimit(store) && additionalStorageRequired(store, key, value) > 0) {
				return false;
			}
		}
		store[key] = value;
		return true;
	}

	_reachedStorageLimit(store) {
		if (!store) {
			return false;
		}

		return (this._sizeLimit > 0 && storeSize(store) >= this._sizeLimit)
			|| (this._keyLimit > 0 && Object.keys(store).length >= this._keyLimit);
	}
}

function storeSize(store) {
	return Object.entries(store)
		.map(([k, v]) => k.length + v.length)
		.reduce((x, y) => x + y, 0);
}

function additionalStorageRequired(store, key, value) {
	if (key in store) {
		return value.length - store[key].length;
	} else {
		return key.length + value.length;
	}
}
