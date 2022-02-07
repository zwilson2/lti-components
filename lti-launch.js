import { css, html, LitElement } from 'lit-element/lit-element.js';
import { classMap } from 'lit-html/directives/class-map.js';
import { heading4Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';

class LtiLaunch extends LitElement {
	static get properties() {
		return {
			iFrameWidth: {
				type: String,
				attribute: 'width'
			},
			iFrameHeight: {
				type: String,
				attribute: 'height'
			},
			_launchUrl: {
				type: String,
				attribute: 'lti-launch-url'
			}
		};
	}

	static get styles() {
		return [heading4Styles, css`
			.d2l-content-frame-default-width {
				width: 100%;
			}
			iframe {
				border: none;
			}
		` ];
	}

	constructor() {
		super();

		this.iFrameHeight = 600;
		this._ltiStorage = {};
	}

	connectedCallback() {
		super.connectedCallback();

		this._handleMessage = this._handleMessage.bind(this);
		window.addEventListener('message', this._handleMessage);
	}

	disconnectedCallback() {
		window.removeEventListener('message', this._handleMessage);
		super.disconnectedCallback();
	}

	render() {
		const iFrameClasses = { 'd2l-content-frame-default-width': !this.iFrameWidth, 'no-border': true };
		return html`<div>
		<iframe id="lti-launch-id" data-test-id="lti-launch-frame" class="${classMap(iFrameClasses)}" allow="microphone *; camera *; autoplay *; display-capture *"
		width="${ifDefined(this.iFrameWidth)}px" height="${this.iFrameHeight}px" src="${this._launchUrl}" title="${this._getTitle()}"></iframe>
</div>`;
	}

	_getTitle() {
		return this._launchUrl ? this._launchUrl.slice(this._launchUrl.indexOf('//') + '//'.length) : 'invalid-launch-iframe';
	}

	_handleMessage(event) {
		if (!event.data) {
			return;
		}

		let params;
		try {
			params = JSON.parse(event.data);

			if (params.subject === 'lti.frameResize') {
				const MAX_FRAME_HEIGHT = 10000;
				if (!params.height || params.height < 1 || params.height > MAX_FRAME_HEIGHT) {
					console.warn('Invalid height value received, aborting');
					return;
				}

				const el = this.shadowRoot && this.shadowRoot.querySelectorAll('iframe');
				if (el) {
					for (let i = 0; i < el.length; i++) {
						if (el[i].contentWindow === event.source) {
							this.iFrameHeight = params.height;
							// eslint-disable-next-line no-console
							console.info(`Setting iFrame height to ${params.height}`);
						}
					}
				}
			}
			return;
		}
		catch (exception) {
			//don't error. new messages are objects and aren't meant to be parsed
		}

		if (!event.data.subject || !event.data.message_id) {
			//TODO: log error?
			return;
		}

		let response = this._processLtiPostMessage(event);
		if (response) {
			response = {
				subject: event.data.subject + ".response",
				message_id: event.data.message_id,
				...response
			}
			event.source.postMessage(response, event.origin);
		}
	}

	_processLtiPostMessage(event) {

		const request = event.data;

		if (request.subject === 'org.imsglobal.lti.capabilities') {
			return this._processLtiPostMessageCapabilities(event);
		}

		if (request.subject === 'org.imsglobal.lti.put_data') {
			return this._processLtiPostMessagePutData(event);
		}

		if (request.subject === 'org.imsglobal.lti.get_data') {
			return this._processLtiPostMessageGetData(event);
		}

		return null;
	}

	_processLtiPostMessageCapabilities(event) {
		return {
			supported_messages: [
				{ subject: 'org.imsglobal.lti.capabilities' },
				{ subject: 'org.imsglobal.lti.put_data' },
				{ subject: 'org.imsglobal.lti.get_data' }
			]
		};
	}

	_processLtiPostMessagePutData(event) {
		const request = event.data;

		if (request.key === null || request.key === undefined) {
			return {
				error: {
					code: 'bad_request',
					message: `The put_data request is missing the 'key' field.`
				}
			};
		}

		if (!this._ltiStorage[event.origin]) {
			this._ltiStorage[event.origin] = {};
		}

		const store = this._ltiStorage[event.origin];

		if (reachedStorageLimit(store)) {
			//TODO: log error

			return {
				error: {
					code: 'storage_exhaustion',
					message: 'Reached storage limit of 4096 bytes / 500 keys.'
				}
			};
		}

		if (request.value === null || request.value === undefined) {
			delete store[request.key];
		} else {
			store[request.key] = request.value;

			if (reachedStorageLimit(store)) {
				//TODO: log error
			}
		}

		return {
			key: request.key,
			value: store[request.key]
		};
	}

	_processLtiPostMessageGetData(event) {
		const request = event.data;

		if (request.key === null || request.key === undefined) {
			return {
				error: {
					code: 'bad_request',
					message: `The get_data request is missing the 'key' field.`
				}
			};
		}

		const store = this._ltiStorage[event.origin];

		if (!store || !(request.key in store)) {
			return {
				error: {
					code: 'key_not_found',
					message: `Key not found: ${request.key}`
				}
			};
		}

		const value = store[request.key];

		return {
			key: request.key,
			value: value
		};
	}
}

function reachedStorageLimit(store) {
	return keyValueStoreSize(store) >= 4096 || Object.keys(store).length >= 500;
}

function keyValueStoreSize(store) {
	Object.entries(store)
		.map(([k,v]) => k.length + v.length)
		.reduce((x, y) => x + y, 0);
}

customElements.define('d2l-lti-launch', LtiLaunch);
