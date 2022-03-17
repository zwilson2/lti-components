# LTI Components

Contains the LTI launch BSI component

## Installation

Install from NPM:

```shell
npm install @d2l/d2l-lti-components
```

## Usage

```html
<script type="module">
    import '@brightspace/lti-components/lti-launch.js';
</script>
<d2l-lti-launch height="600" width="600" lti-launch-url="https://example.com"></d2l-lti-launch>
```

**Properties:**

| Property | Type | Description |
|--|--|--|
| 'height' | String, required | The height of the iframe |
| 'width' | String | The width of the iframe |
| 'lti-launch-url' | String, required | A string corresponding to the LTI launch URL |

## Developing, Testing and Contributing

After cloning the repo, run `npm install` to install dependencies.

### Developing with the BSI (Brightspace Integration)
To start working with the BSI clone the [repo](https://github.com/Brightspace/brightspace-integration) locally.

#### NPM Linking the lti-activity Component With the BSI
To get our local changes in lti-components to work in our local BSI we need to set up a local npm link. This will
have the BSI pull in our local lti-components folder into its NPM modules folder.

The first step is to npm link the lti-components repo, from the repo root run
```shell
npm link
```
This creates a module in our local npm store.
Next we need to set up the BSI repo to pull this module from our local npm store. Go to the BSI directory and run
```shell
npm link d2l-lti-components
```

### Running the BSI Locally
Follow the instructions for [Building & Running a Local BSI](https://github.com/Brightspace/brightspace-integration#building--running-a-local-bsi)
and follow the development build instructions. You can use the config files method or the config variables method.
```shell
npm run start
```

#### Running the BSI With Sitelord
You can set up a Sitelord site to use your local BSI by running a ngrok tunnel to where your local BSI is running. Then
on the sitelord site set the d2l.System.BsiEndpointOverride config variable to your ngrok tunnel. Also set the
d2l.System.BsiEnvironmentOverride to development.
```shell
ngrok http 8080 # or whatever port your local BSI is running on
```

### Linting

```shell
# eslint and lit-analyzer
npm run lint

# eslint only
npm run lint:eslint
```

### Testing

```shell
# lint & run headless unit tests
npm test

# unit tests only
npm run test:headless

# debug or run a subset of local unit tests
npm run test:headless:watch
```

#### Test Troubleshooting

##### Timeout

Error: `The browser was unable to create and start a test page after 30000ms. You can increase this timeout with the browserStartTimeout option.`

Update the web-test-runner config file to allow chrome to launch without a sandbox. 

<pre><code>
<b>import { chromeLauncher } from '@web/test-runner';</b>

export default {
	files: './test/*.test.js',
	nodeResolve: true,
	testFramework: {
		config: {
			ui: 'bdd',
			timeout: '10000',
		}
	},
	<b>browsers: [chromeLauncher({ launchOptions: { args: ['--no-sandbox'] } })],</b>
	testRunnerHtml: testFramework =>
		`<html>
			<body>
				<script src="node_modules/@brightspace-ui/core/tools/resize-observer-test-error-handler.js"></script>
				<script type="module" src="${testFramework}"></script>
			</body>
		</html>`
};
</code></pre>

### Running the demos

To start a [@web/dev-server](https://modern-web.dev/docs/dev-server/overview/) that hosts the demo page and tests:

```shell
npm start
```

## Versioning & Releasing

> TL;DR: Commits prefixed with `fix:` and `feat:` will trigger patch and minor releases when merged to `main`. Read on for more details...

The [semantic-release GitHub Action](https://github.com/BrightspaceUI/actions/tree/master/semantic-release) is called from the `release.yml` GitHub Action workflow to handle version changes and releasing.

### Version Changes

All version changes should obey [semantic versioning](https://semver.org/) rules:
1. **MAJOR** version when you make incompatible API changes,
2. **MINOR** version when you add functionality in a backwards compatible manner, and
3. **PATCH** version when you make backwards compatible bug fixes.

The next version number will be determined from the commit messages since the previous release. Our semantic-release configuration uses the [Angular convention](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular) when analyzing commits:
* Commits which are prefixed with `fix:` or `perf:` will trigger a `patch` release. Example: `fix: validate input before using`
* Commits which are prefixed with `feat:` will trigger a `minor` release. Example: `feat: add toggle() method`
* To trigger a MAJOR release, include `BREAKING CHANGE:` with a space or two newlines in the footer of the commit message
* Other suggested prefixes which will **NOT** trigger a release: `build:`, `ci:`, `docs:`, `style:`, `refactor:` and `test:`. Example: `docs: adding README for new component`

To revert a change, add the `revert:` prefix to the original commit message. This will cause the reverted change to be omitted from the release notes. Example: `revert: fix: validate input before using`.

### Releases

When a release is triggered, it will:
* Update the version in `package.json`
* Tag the commit
* Create a GitHub release (including release notes)
* Deploy a new package to CodeArtifact

### Releasing from Maintenance Branches

Occasionally you'll want to backport a feature or bug fix to an older release. `semantic-release` refers to these as [maintenance branches](https://semantic-release.gitbook.io/semantic-release/usage/workflow-configuration#maintenance-branches).

Maintenance branch names should be of the form: `+([0-9])?(.{+([0-9]),x}).x`.

Regular expressions are complicated, but this essentially means branch names should look like:
* `1.15.x` for patch releases on top of the `1.15` release (after version `1.16` exists)
* `2.x` for feature releases on top of the `2` release (after version `3` exists)