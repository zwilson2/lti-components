import { createClient } from '@brightspace-ui/logging';
import { LtiStorage } from './lti-storage.js';

const LTI_POSTMESSAGE_SUBJECT_CAPABILITIES = 'org.imsglobal.lti.capabilities';
const LTI_POSTMESSAGE_SUBJECT_PUTDATA = 'org.imsglobal.lti.put_data';
const LTI_POSTMESSAGE_SUBJECT_GETDATA = 'org.imsglobal.lti.get_data';

const logger = createClient('lti-components');

export class LtiPostmessageApi {

	constructor(checkLtiStorageLimitFlag) {
		this._ltiStorage = new LtiStorage(checkLtiStorageLimitFlag);
	}

	processLtiPostMessage(event) {
		if (!event.data.subject || !event.data.subject.startsWith('org.imsglobal.lti')) {
			return null;
		}
		if (!event.data.message_id) {
			const errorLog = {
				error: {
					code: 'bad_request',
					message: 'There is no message_id within event.data being sent'
				}
			};
			this._logError(JSON.stringify(errorLog));

			return errorLog;
		}

		let response = this._processLtiPostMessageHelper(event);
		if (response) {
			response = {
				subject: `${event.data.subject}.response`,
				message_id: event.data.message_id,
				...response
			};
		}
		return response;
	}

	_logError(message) {
		logger.error(null, message);
	}

	_processLtiPostMessageCapabilities() {
		return {
			supported_messages: [
				{ subject: LTI_POSTMESSAGE_SUBJECT_CAPABILITIES },
				{ subject: LTI_POSTMESSAGE_SUBJECT_PUTDATA },
				{ subject: LTI_POSTMESSAGE_SUBJECT_GETDATA }
			]
		};
	}

	_processLtiPostMessageGetData(event) {
		if (!event.data.key) {
			return {
				error: {
					code: 'bad_request',
					message: 'The get_data request is missing the \'key\' field.'
				}
			};
		}

		const value = this._ltiStorage.get(event.origin, event.data.key);

		if (value === null || value === undefined) {
			this._logError(`${LTI_POSTMESSAGE_SUBJECT_GETDATA}: key not found`);
			return {
				error: {
					code: 'key_not_found',
					message: `Key not found: ${event.data.key}`
				}
			};
		}

		return {
			key: event.data.key,
			value: value
		};
	}

	_processLtiPostMessageHelper(event) {
		if (event.data.subject === LTI_POSTMESSAGE_SUBJECT_CAPABILITIES) {
			return this._processLtiPostMessageCapabilities();
		}

		if (event.data.subject === LTI_POSTMESSAGE_SUBJECT_GETDATA) {
			return this._processLtiPostMessageGetData(event);
		}

		if (event.data.subject === LTI_POSTMESSAGE_SUBJECT_PUTDATA) {
			return this._processLtiPostMessagePutData(event);
		}

		const errorLog = {
			error: {
				code: 'unsupported_subject',
				message: `${event.data.subject} is not a supported capability subject`
			}
		};
		this._logError(JSON.stringify(errorLog));
		return errorLog;
	}

	_processLtiPostMessagePutData(event) {
		if (!event.data.key) {
			return {
				error: {
					code: 'bad_request',
					message: 'The put_data request is missing the \'key\' field.'
				}
			};
		}

		if (!this._ltiStorage.tryPut(event.origin, event.data.key, event.data.value)) {
			this._logError(`${LTI_POSTMESSAGE_SUBJECT_PUTDATA}: reached storage limit`);

			return {
				error: {
					code: 'storage_exhaustion',
					message: `For specified origin the combination of key/value pairs have reached or exceeded storage limit of ${this._ltiStorage._sizeLimit} bytes. The number of keys are ${Object.keys(this._ltiStorage.getStore(event.origin)).length} and the number of bytes used are ${this._ltiStorage._storeSize(this._ltiStorage.getStore(event.origin))}`
				}
			};
		}

		if (this._ltiStorage.reachedStorageLimit(event.origin)) {
			this._logError(`${LTI_POSTMESSAGE_SUBJECT_PUTDATA}: reached storage limit`);
		}

		const response = {
			key: event.data.key
		};
		if (event.data.value !== null && event.data.value !== undefined) {
			response.value = event.data.value;
		}

		return response;
	}
}
