<br />
<p align="center"><img width="128" alt="Khan Academy Notifications Logo" src="https://raw.githubusercontent.com/eliasmurcray/ka-notifications/main/src/images/128.png"></p>
<br />
<p align="center">The unofficial extension for Khan Academy notifications.</p>
<br />
<p align="center"><a rel="noreferrer noopener" href="https://chromewebstore.google.com/detail/khan-academy-notification/gdlfnahbohjggjhpcmabnfikiigncjbd"><img alt="Chrome Web Store" src="https://img.shields.io/badge/Chrome-141e24.svg?&style=for-the-badge&logo=google-chrome&logoColor=white"></a></p>
<p align="center">
  <a href="https://www.codefactor.io/repository/github/eliasmurcray/ka-notifications">
    <img src="https://www.codefactor.io/repository/github/eliasmurcray/ka-notifications/badge" alt="CodeFactor">
  </a>
  <img src="https://img.shields.io/chrome-web-store/rating/gdlfnahbohjggjhpcmabnfikiigncjbd.svg?color=00b16a" alt="Rating">
  <img src="https://img.shields.io/chrome-web-store/users/gdlfnahbohjggjhpcmabnfikiigncjbd.svg?color=07f" alt="User Count">
</p>

<h2 align="center">Khan Academy Notifications</h2>

<p align="center">Inspired by <a href="https://github.com/ka-extension/ka-extension-ts">The Khan Academy Extension</a>, Khan Academy Notifications is an extension dedicated to timely delivery of user notifications, alongside additional features aimed at augmenting the learner's experience.</p>
<br />

## Feedback

For direct contact with the developer team, check out our [Discord server](https://discord.com/invite/peexFK5dz6).

If you would like to report a bug or have any other feedback, please [create an issue](https://github.com/eliasmurcray/ka-notifications/issues) on our GitHub repository.

## Features

- Instantly reply to notifications in the popup.
- Mark all notifications as read in one click.
- Experience lightning-fast loading times with predictive preloading techniques.
- Boost your Khan Academy experience with the ability to load 100 replies at a time, instead of just 10.
- Take control of your browsing experience with customizable comment sorting on Khan Academy.

## Development

Outlined below are two pre-established development processes for prospective contributors. Prior to beginning either process, ensure you have a clone of the code.

```bash
git clone https://github.com/eliasmurcray/ka-notifications.git
cd ka-notifications
npm install
```

### Chrome

To begin, run the following command:

```bash
npm run dev
```

Proceed to make your code changes. It should update after every save. To test the extension on Chrome, follow these steps:

1. Open a new tab in your Chrome browser.

2. In the address bar, type `chrome://extensions` and press Enter.

3. In the top right corner of the "Extensions" page, you'll find a switch that says "Developer Mode." Turn it on.

4. With "Developer Mode" enabled, you can now click the "Load Unpacked" button located in the top left corner of the same "Extensions" page.

5. Navigate to and select your `chrome/` folder.

6. Your extension should now be loaded and running in Chrome.

**Note:** In the future, if you have the extension already running locally, you can update it as follows:

1. Open a new tab in your Chrome browser.

2. In the address bar, type `chrome://extensions` and press Enter.

3. On the "Extensions" page, look in the top left corner, and you'll see an "Update" button.

4. Click the "Update" button, and it will pull the latest version of the extension from the same location on your computer and update it.

### Firefox

Firefox is now unsupported!

Unfortunately, Firefox does not have a hot reload technique. You will have to run the following command whenever making a code change for testing on Firefox:

```bash
npm run release
```

To test the extension on Firefox, follow these steps:

1. Navigate to `about:debugging#/runtime/this-firefox` in your browser.

2. Expand the "Temporary Extensions" section.

3. Click "Load Temporary Add-on" and upload the latest zip file from the `zip/` directory, which should contain a file with the letter "f."

4. To grant the extension the necessary permissions, right-click on the extension icon in your toolbar.

5. Click on "Manage Extension" from the context menu.

6. Go to the Permissions tab.

7. Turn on the switch that allows access to `https://www.khanacademy.org`.

### Submitting a PR

Before submitting a PR, please run the following command to ensure the code passes the syntax and style checks:

```bash
npm run release
```

Then submit a PR as normal.
