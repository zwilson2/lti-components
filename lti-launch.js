import { css, html, LitElement } from 'lit-element/lit-element.js';
import { classMap } from 'lit-html/directives/class-map.js';
import { heading4Styles } from '@brightspace-ui/core/components/typography/styles.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';
import { LtiPostmessageApi } from './lti-postmessage-api.js';

export class LtiLaunch extends LitElement {
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
		this._ltiPostmessageApi = new LtiPostmessageApi(ltiStorageLimitFlag());
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

		if (typeof event.data === 'string') {
			const params = JSON.parse(event.data);

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

		const response = this._ltiPostmessageApi.processLtiPostMessage(event);
		if (response) {
			event.source.postMessage(response, event.origin);
		}

		return null;
	}
}

function ltiStorageLimitFlag() {
	return D2L.LP.Web.UI.Flags.Flag('us132260-lti-component-postmessage-storage-limit', true);
}

customElements.define('d2l-lti-launch', LtiLaunch);
