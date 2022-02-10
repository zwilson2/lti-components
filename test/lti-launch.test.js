import { expect, fixture, html } from '@open-wc/testing';
import { LtiLaunch } from '../lti-launch.js';
import { runConstructor } from '@brightspace-ui/core/tools/constructor-test-helper.js';

describe('d2l-lti-launch', () => {

	describe('accessibility', () => {
		it('should pass all aXe tests', async() => {
			const el = await fixture(html`<d2l-lti-launch></d2l-lti-launch>`);
			await expect(el).to.be.accessible();
		});
	});

	describe('constructor', () => {
		it('should construct', () => {
			runConstructor('d2l-lti-launch');
		});
	});

	describe('iframe setup', () => {
		const launchUrl = 'http://example.com/';
		const height = '500';
		const width = '400';
		const iframeHeight = '500px';
		const iframeWidth = '400px';
		const iframeId = 'lti-launch-id';
		const iframeTestId = 'lti-launch-frame';
		const iframeClass = 'no-border';
		const iframeClassNoWidth = 'd2l-content-frame-default-width no-border';
		const iframeTitle = 'example.com/';

		it('should reflect properties provided', async() => {
			const element = await fixture(html`<d2l-lti-launch height="${height}" width="${width}" lti-launch-url="${launchUrl}"></d2l-lti-launch>`);

			expect(element.shadowRoot.querySelector('iframe').getAttribute('id')).equals(iframeId);
			expect(element.shadowRoot.querySelector('iframe').getAttribute('data-test-id')).equals(iframeTestId);
			expect(element.shadowRoot.querySelector('iframe').getAttribute('class')).equals(iframeClass);
			expect(element.shadowRoot.querySelector('iframe').getAttribute('src')).equals(launchUrl);
			expect(element.shadowRoot.querySelector('iframe').getAttribute('title')).equals(iframeTitle);
			expect(element.shadowRoot.querySelector('iframe').getAttribute('height')).equals(iframeHeight);
			expect(element.shadowRoot.querySelector('iframe').getAttribute('width')).equals(iframeWidth);
		});

		it('should leave out width if not defined', async() => {
			const element = await fixture(html`<d2l-lti-launch height="${height}" lti-launch-url="${launchUrl}"></d2l-lti-launch>`);

			expect(element.shadowRoot.querySelector('iframe').getAttribute('id')).equals(iframeId);
			expect(element.shadowRoot.querySelector('iframe').getAttribute('data-test-id')).equals(iframeTestId);
			expect(element.shadowRoot.querySelector('iframe').getAttribute('class')).equals(iframeClassNoWidth);
			expect(element.shadowRoot.querySelector('iframe').getAttribute('src')).equals(launchUrl);
			expect(element.shadowRoot.querySelector('iframe').getAttribute('title')).equals(iframeTitle);
			expect(element.shadowRoot.querySelector('iframe').getAttribute('height')).equals(iframeHeight);
			expect(element.shadowRoot.querySelector('iframe').getAttribute('width')).equals(null);
		});
	});

	describe('lti postMessage support', () => {
		it('should respond to get capabilities', () => {
			const ltiLaunch = new LtiLaunch();

			const event = {
				data: {
					subject: 'org.imsglobal.lti.capabilities',
					message_id: '12345'
				},
				origin: 'http://example.com'
			};

			const response = ltiLaunch._processLtiPostMessage(event);

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
});
