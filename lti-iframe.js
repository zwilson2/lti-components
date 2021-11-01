import { css, html, LitElement } from 'lit-element/lit-element.js';
import { classMap } from 'lit-html/directives/class-map.js';
import { heading4Styles } from '@brightspace-ui/core/components/typography/styles.js';

class LtiIFrame extends LitElement {
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
			.d2l-content-frame {
				margin: 1rem 0 0.6rem 0;
			}
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
		return html`<div class="d2l-content-frame">
		${this.iFrameWidth ? 
			html`<iframe id="lti-iframe-id" class="${classMap(iFrameClasses)}" allow="microphone *; camera *; autoplay *"
		width="${this.iFrameWidth}px" height="${this.iFrameHeight}px" src="${this._launchUrl}"></iframe>` :
			html`<iframe id="lti-iframe-id" class="${classMap(iFrameClasses)}" allow="microphone *; camera *; autoplay *"
		height="${this.iFrameHeight}px" src="${this._launchUrl}"></iframe>`}
</div>`;
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
					return;
				}

				const el = this.shadowRoot.querySelectorAll('iframe');
				for (let i = 0; i < el.length; i++) {
					if (el[i].contentWindow === event.source) {
						this.iFrameHeight = params.height;
						// eslint-disable-next-line no-console
						console.info(`Setting iFrame height to ${params.height}`);
					}
				}
			}
			return;
		}
		catch (exception) {
			//don't error. new messages are objects and aren't meant to be parsed
		}
	}
}

customElements.define('d2l-lti-iframe', LtiIFrame);
