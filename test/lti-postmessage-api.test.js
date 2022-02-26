import { expect } from '@open-wc/testing';
import { LtiPostmessageApi } from '../lti-postmessage-api.js';
import sinon from 'sinon';

describe('lti postmessage api', () => {
	let api;

	beforeEach(() => {
		api = new LtiPostmessageApi(true);

		sinon.stub(api, '_logError');
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('capabilities', () => {
		it('should respond to get capabilities', () => {
			const event = {
				data: {
					subject: 'org.imsglobal.lti.capabilities',
					message_id: '12345'
				},
				origin: 'http://example.com'
			};

			const response = api.processLtiPostMessage(event);

			const expected = {
				subject: 'org.imsglobal.lti.capabilities.response',
				message_id: '12345',
				supported_messages: [
					{ subject: 'org.imsglobal.lti.capabilities' },
					{ subject: 'org.imsglobal.lti.put_data' },
					{ subject: 'org.imsglobal.lti.get_data' }
				]
			};
			expect(response).eqls(expected);
		});
	});

	describe('storage', () => {
		it('should return null when sending invalid subject', () => {
			const putEvent = {
				data: {
					subject: 'orggg.imsglobal.lti.put_data',
					message_id: '123456',
					key: 'my_key',
					value: 'my_data'
				},
				origin: 'http://example.com'
			};

			const putResponse = api.processLtiPostMessage(putEvent);
			expect(putResponse).eqls(null);
		});

		it('should store and retrieve data', () => {
			const putEvent = {
				data: {
					subject: 'org.imsglobal.lti.put_data',
					message_id: '123456',
					key: 'my_key',
					value: 'my_data'
				},
				origin: 'http://example.com'
			};

			const putResponse = api.processLtiPostMessage(putEvent);

			expect(putResponse).eqls({
				subject: 'org.imsglobal.lti.put_data.response',
				message_id: '123456',
				key: 'my_key',
				value: 'my_data'
			});

			const getEvent = {
				data: {
					subject: 'org.imsglobal.lti.get_data',
					message_id: '123456',
					key: 'my_key'
				},
				origin: 'http://example.com'
			};

			const getResponse = api.processLtiPostMessage(getEvent);
			expect(getResponse).eqls({
				subject: 'org.imsglobal.lti.get_data.response',
				message_id: '123456',
				key: 'my_key',
				value: 'my_data'
			});
		});

		it('should replace data stored using same key', () => {
			let putEvent = {
				data: {
					subject: 'org.imsglobal.lti.put_data',
					message_id: '1',
					key: 'my_key',
					value: 'my_data'
				},
				origin: 'http://example.com'
			};
			let putResponse = api.processLtiPostMessage(putEvent);

			putEvent = {
				data: {
					subject: 'org.imsglobal.lti.put_data',
					message_id: '2',
					key: 'my_key',
					value: 'my_data_2'
				},
				origin: 'http://example.com'
			};
			putResponse = api.processLtiPostMessage(putEvent);
			expect(putResponse).eqls({
				subject: 'org.imsglobal.lti.put_data.response',
				message_id: '2',
				key: 'my_key',
				value: 'my_data_2'
			});

			const getEvent = {
				data: {
					subject: 'org.imsglobal.lti.get_data',
					message_id: '3',
					key: 'my_key',
				},
				origin: 'http://example.com'
			};
			const getResponse = api.processLtiPostMessage(getEvent);
			expect(getResponse).eqls({
				subject: 'org.imsglobal.lti.get_data.response',
				message_id: '3',
				key: 'my_key',
				value: 'my_data_2'
			});
		});

		it('should clear key when value omitted', () => {
			let putEvent = {
				data: {
					subject: 'org.imsglobal.lti.put_data',
					message_id: '1',
					key: 'my_key',
					value: 'my_data'
				},
				origin: 'http://example.com'
			};
			api.processLtiPostMessage(putEvent);

			putEvent = {
				data: {
					subject: 'org.imsglobal.lti.put_data',
					message_id: '2',
					key: 'my_key'
				},
				origin: 'http://example.com'
			};
			const putResponse = api.processLtiPostMessage(putEvent);
			expect(putResponse).eqls({
				subject: 'org.imsglobal.lti.put_data.response',
				message_id: '2',
				key: 'my_key',
				value: undefined
			});
		});

		it('should clear key when value null', () => {
			let putEvent = {
				data: {
					subject: 'org.imsglobal.lti.put_data',
					message_id: '1',
					key: 'my_key',
					value: 'my_data'
				},
				origin: 'http://example.com'
			};
			api.processLtiPostMessage(putEvent);

			putEvent = {
				data: {
					subject: 'org.imsglobal.lti.put_data',
					message_id: '2',
					key: 'my_key',
					value: null
				},
				origin: 'http://example.com'
			};
			const putResponse = api.processLtiPostMessage(putEvent);
			expect(putResponse).eqls({
				subject: 'org.imsglobal.lti.put_data.response',
				message_id: '2',
				key: 'my_key',
				value: null
			});
		});

		it('should store empty string value', () => {
			const putEvent = {
				data: {
					subject: 'org.imsglobal.lti.put_data',
					message_id: '1',
					key: 'my_key',
					value: ''
				},
				origin: 'http://example.com'
			};
			const putResponse = api.processLtiPostMessage(putEvent);
			expect(putResponse).eqls({
				subject: 'org.imsglobal.lti.put_data.response',
				message_id: '1',
				key: 'my_key',
				value: ''
			});
		});

		it('should store 2 entries with same key scoped to different origins', () => {
			// Setup
			let putEvent = {
				data: {
					subject: 'org.imsglobal.lti.put_data',
					message_id: '1',
					key: 'my_key',
					value: 'example_data'
				},
				origin: 'http://example.com'
			};
			api.processLtiPostMessage(putEvent);

			putEvent = {
				data: {
					subject: 'org.imsglobal.lti.put_data',
					message_id: '2',
					key: 'my_key',
					value: 'foobar_data'
				},
				origin: 'http://foobar.com'
			};
			api.processLtiPostMessage(putEvent);

			// Assert
			const getExampleKeyEvent = {
				data: {
					subject: 'org.imsglobal.lti.get_data',
					message_id: '3',
					key: 'my_key'
				},
				origin: 'http://example.com'
			};
			const getExampleKeyResponse = api.processLtiPostMessage(getExampleKeyEvent);
			expect(getExampleKeyResponse).eqls({
				subject: 'org.imsglobal.lti.get_data.response',
				message_id: '3',
				key: 'my_key',
				value: 'example_data'
			});

			const getFoobarKeyEvent = {
				data: {
					subject: 'org.imsglobal.lti.get_data',
					message_id: '4',
					key: 'my_key'
				},
				origin: 'http://foobar.com'
			};
			const getFoobarKeyResponse = api.processLtiPostMessage(getFoobarKeyEvent);
			expect(getFoobarKeyResponse).eqls({
				subject: 'org.imsglobal.lti.get_data.response',
				message_id: '4',
				key: 'my_key',
				value: 'foobar_data'
			});

		});

		it('should return key_not_found when accessing key under different origin', () => {
			// Setup
			const putEvent = {
				data: {
					subject: 'org.imsglobal.lti.put_data',
					message_id: '1',
					key: 'my_key',
					value: 'example_data'
				},
				origin: 'http://example.com'
			};
			api.processLtiPostMessage(putEvent);

			// Assert
			const getEvent = {
				data: {
					subject: 'org.imsglobal.lti.get_data',
					message_id: '2',
					key: 'my_key'
				},
				origin: 'http://foobar.com'
			};
			const getResponse = api.processLtiPostMessage(getEvent);
			expect(getResponse).eqls({
				subject: 'org.imsglobal.lti.get_data.response',
				message_id: '2',
				error: {
					code: 'key_not_found',
					message: 'Key not found: my_key'
				}
			});
		});

		it('should allowing storing big entry when under storage limit', () => {
			const putEvent = {
				data: {
					subject: 'org.imsglobal.lti.put_data',
					message_id: '1',
					key: 'my_key',
					value: 'a'.repeat(5000)
				},
				origin: 'http://example.com'
			};
			const putResponse = api.processLtiPostMessage(putEvent);
			expect(putResponse).eqls({
				subject: 'org.imsglobal.lti.put_data.response',
				message_id: '1',
				key: 'my_key',
				value: 'a'.repeat(5000)
			});
		});

		it('should return exceeded storage error code when storing entry while over storage limit', () => {
			let putEvent = {
				data: {
					subject: 'org.imsglobal.lti.put_data',
					message_id: '1',
					key: 'my_key',
					value: 'a'.repeat(5000)
				},
				origin: 'http://example.com'
			};
			api.processLtiPostMessage(putEvent);

			putEvent = {
				data: {
					subject: 'org.imsglobal.lti.put_data',
					message_id: '2',
					key: 'my_key_2',
					value: 'my_data_2'
				},
				origin: 'http://example.com'
			};
			const putResponse = api.processLtiPostMessage(putEvent);
			expect(putResponse).eqls({
				subject: 'org.imsglobal.lti.put_data.response',
				message_id: '2',
				error: {
					code: 'storage_exhaustion',
					message: 'For specified origin the combination of key/value pairs have reached or exceeded storage limit of 4096 bytes. The number of keys are 1 and the number of bytes used are 5006'
				}
			});
		});

		it('should allow replacing data with smaller data while over storage limit', () => {
			let putEvent = {
				data: {
					subject: 'org.imsglobal.lti.put_data',
					message_id: '1',
					key: 'my_key',
					value: 'a'.repeat(5000)
				},
				origin: 'http://example.com'
			};
			api.processLtiPostMessage(putEvent);

			putEvent = {
				data: {
					subject: 'org.imsglobal.lti.put_data',
					message_id: '2',
					key: 'my_key',
					value: 'my_data'
				},
				origin: 'http://example.com'
			};
			const putResponse = api.processLtiPostMessage(putEvent);
			expect(putResponse).eqls({
				subject: 'org.imsglobal.lti.put_data.response',
				message_id: '2',
				key: 'my_key',
				value: 'my_data'
			});
		});

		it('should return exceeded storage error code when replacing data with bigger data while over storage limit', () => {
			let putEvent = {
				data: {
					subject: 'org.imsglobal.lti.put_data',
					message_id: '1',
					key: 'my_key',
					value: 'a'.repeat(5000)
				},
				origin: 'http://example.com'
			};
			api.processLtiPostMessage(putEvent);

			putEvent = {
				data: {
					subject: 'org.imsglobal.lti.put_data',
					message_id: '2',
					key: 'my_key',
					value: 'a'.repeat(5001)
				},
				origin: 'http://example.com'
			};
			const putResponse = api.processLtiPostMessage(putEvent);
			expect(putResponse).eqls({
				subject: 'org.imsglobal.lti.put_data.response',
				message_id: '2',
				error: {
					code: 'storage_exhaustion',
					message: 'For specified origin the combination of key/value pairs have reached or exceeded storage limit of 4096 bytes. The number of keys are 1 and the number of bytes used are 5006'
				}
			});
		});
	});
});
