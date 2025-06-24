<div align="center">

<img src="icons/icon128.png" alt="Intro Skipper Logo" width="128" height="128">

# Intro Skipper

### _Skip intros automatically on your favorite streaming platforms_

**A powerful browser extension that intelligently detects and skips intro sequences across multiple streaming services with zero configuration required.**

---

### 📥 Download & Install

<div align="center">

| Browser                                                                                                         | Download Link         | Status      |
| --------------------------------------------------------------------------------------------------------------- | --------------------- | ----------- |
| ![Chrome](https://img.shields.io/badge/Chrome-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)     | [Chrome Web Store](#) | Coming Soon |
| ![Firefox](https://img.shields.io/badge/Firefox-FF7139?style=for-the-badge&logo=firefoxbrowser&logoColor=white) | [Firefox Add-ons](#)  | Coming Soon |

</div>

**🔧 Manual Installation** (Developer Mode)

### Chrome/Edge Installation

1. Download the [latest release](https://github.com/dsouravcom/intro-skipper-ext/releases)
2. Open `chrome://extensions/` in your browser
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `chrome/` folder from the extension directory

### Firefox Installation

1. Download the [latest release](https://github.com/dsouravcom/intro-skipper-ext/releases)
2. Open `about:debugging` in Firefox
3. Click "This Firefox" in the sidebar
4. Click "Load Temporary Add-on"
5. Navigate to the `firefox/` folder and select `manifest.json`

**Note**: For permanent installation in Firefox, you'll need to sign the extension through Mozilla's Add-on Developer Hub.

---

### 🎭 Supported Streaming Services

<div align="center">

| Service         | Logo                                                                                                                                      | Auto-Skip | Status     |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| **Netflix**     | <img src="https://img.shields.io/badge/Netflix-E50914?style=for-the-badge&logo=netflix&logoColor=white" alt="Netflix">                    | ✅ Intro  | 🟢 Active  |
| **Crunchyroll** | <img src="https://img.shields.io/badge/Crunchyroll-F47521?style=for-the-badge&logo=crunchyroll&logoColor=white" alt="Crunchyroll">        | ✅ Intro  | 🟢 Active  |
| **Disney+**     | <img src="https://img.shields.io/badge/Hotstar-blue?logo=hotstar&logoColor=white" alt="Disney+">                                          | ⏳ Intro  | 🟡 Planned |
| **Prime Video** | <img src="https://img.shields.io/badge/Prime%20Video-232F3E?style=for-the-badge&logo=amazonprimevideo&logoColor=white" alt="Prime Video"> | ⏳ Intro  | 🟡 Planned |

</div>

_🔄 More services coming soon! [Request a service](https://github.com/dsouravcom/intro-skipper-ext/issues/new?template=feature_request.md)_

---

</div>

## 📋 Table of Contents

-   [🚀 Features](#-features)
-   [⚙️ Configuration](#️-configuration)
-   [🎯 How It Works](#-how-it-works)
-   [🔍 Troubleshooting](#-troubleshooting)
-   [🛠️ Development & Customization](#️-development--customization)
-   [🤝 Contributing](#-contributing)
-   [🔒 Privacy & Security](#-privacy--security)
-   [📜 License & Credits](#-license--credits)
-   [🏆 Contributors](#-contributors)
-   [📝 Changelog](#-changelog)
-   [⚠️ Disclaimer](#️-disclaimer)

## 🚀 Features

✨ **Instant Detection** - Automatically detects skip buttons with zero delays  
🎯 **Smart Fallbacks** - Multiple detection methods ensure reliability  
🔧 **Easy Configuration** - Simple toggle controls for each service  
💾 **Local Storage** - All settings stored securely in your browser  
🔒 **Privacy First** - No data collection or external requests  
⚡ **Lightweight** - Optimized for minimal resource usage  
🎨 **Clean Interface** - Modern, intuitive settings panel

---

## ⚙️ Configuration

### 🌐 Global Settings

-   **� Master Toggle**: Enable/disable auto-skip for all streaming services
-   **🎛️ Service Management**: Individual control for each streaming platform

### 🎭 Service-Specific Settings

-   **🔘 Per-Service Toggle**: Enable/disable individual streaming services
-   **🔍 Automatic Detection**: Seamlessly works on supported platforms
-   **⚡ Instant Skipping**: No delays or configuration needed

### 🎨 Interface

-   **🖱️ One-Click Access**: Quick toggle from browser toolbar
-   **⚙️ Advanced Settings**: Detailed configuration in extension options
-   **📱 Responsive Design**: Works on all screen sizes

---

## 🎯 How It Works

### Advanced Button Detection

1. **Primary Selector**: Service-specific CSS selectors
2. **Fallback Selectors**: Generic button patterns (`button[class*="skip"]`)
3. **Text Search**: Searches for "Skip Intro" text content
4. **Parent Element**: Attempts clicking clickable parent elements
5. **Aria Labels**: Checks `aria-label` attributes

## 🎯 Features

-   **Instant Skipping**: No delays, immediate response when button is detected
-   **Multi-method Detection**: Multiple fallback detection strategies
-   **Clean Interface**: Simple toggle controls for each service
-   **Local Storage**: All data stored locally in your browser

## 🔍 Troubleshooting

### Extension Not Working

-   Ensure extension is enabled and pinned
-   Check that global toggle is ON
-   Verify service-specific settings
-   Refresh the streaming page

### Performance Issues

-   Check for conflicts with other extensions
-   Clear browser cache and cookies
-   Monitor browser console for errors

## 🛠️ Development & Customization

### 📁 Project Structure

```
intro-skipper/
├── README.md                       # Project documentation
├── chrome/                         # Chrome extension files
│   ├── manifest.json              # Chrome extension manifest
│   ├── background.js               # Background service worker
│   ├── popup.html                  # Extension popup interface
│   ├── popup.js                    # Popup functionality
│   ├── manage.html                 # Settings page
│   ├── manage.js                   # Settings functionality
│   ├── License                     # License file
│   ├── content-scripts/            # Content scripts directory
│   │   ├── crunchyroll.js         # Crunchyroll skip logic
│   │   └── netflix.js             # Netflix skip logic
│   └── icons/                      # Extension icons
│       ├── icon16.png             # 16x16 icon
│       ├── icon48.png             # 48x48 icon
│       └── icon128.png            # 128x128 icon
└── firefox/                        # Firefox extension files
    ├── manifest.json               # Firefox extension manifest
    ├── background.js               # Background script
    ├── popup.html                  # Extension popup interface
    ├── popup.js                    # Popup functionality
    ├── manage.html                 # Settings page
    ├── manage.js                   # Settings functionality
    ├── browser-compatibility.js    # Firefox compatibility layer
    ├── package.json                # Firefox packaging config
    ├── web-ext-config.json         # Web-ext tool configuration
    ├── LICENSE                     # License file
    ├── DEVELOPMENT.md              # Firefox development guide
    ├── BROWSER_COMPARISON.md       # Browser differences documentation
    ├── content-scripts/            # Content scripts directory
    │   ├── crunchyroll.js         # Crunchyroll skip logic
    │   └── netflix.js             # Netflix skip logic
    └── icons/                      # Extension icons
        ├── icon16.png             # 16x16 icon
        ├── icon48.png             # 48x48 icon
        └── icon128.png            # 128x128 icon
```

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help improve the extension:

### 🚀 Getting Started

1. **Fork the Repository**

    ```bash
    git clone https://github.com/dsouravcom/intro-skipper-ext
    cd intro-skipper-ext
    ```

2. **Set Up Development Environment**

    **For Chrome Development:**

    - Install a code editor (VS Code recommended)
    - Enable Developer Mode in Chrome (`chrome://extensions/`)
    - Load the `chrome/` folder as an unpacked extension

    **For Firefox Development:**

    ```bash
    # Install web-ext tool for Firefox development
    npm install --global web-ext

    # Navigate to Firefox directory
    cd firefox/

    # Install development dependencies
    npm install

    # Run extension in temporary Firefox profile
    web-ext run
    ```

3. **Development Workflow**
    - Make changes to extension files
    - **Chrome**: Refresh extension in `chrome://extensions/`
    - **Firefox**: Extension auto-reloads with `web-ext run`
    - Test functionality on streaming platforms

### 🎯 Ways to Contribute

#### 🐛 Bug Reports

-   Use the GitHub Issues template
-   Include browser version and OS details
-   Provide step-by-step reproduction steps
-   Add screenshots or console logs if applicable

#### ✨ Feature Requests

-   Check existing issues to avoid duplicates
-   Clearly describe the proposed feature
-   Explain the use case and benefits
-   Consider implementation complexity

#### 🔧 Code Contributions

**Adding New Streaming Services:**

1. Create `content-scripts/[service-name].js` in both `chrome/` and `firefox/` directories
2. Add match pattern to both `manifest.json` files:

    **Chrome manifest.json:**

    ```json
    {
        "matches": ["*://[service-domain]/*"],
        "js": ["content-scripts/[service-name].js"],
        "run_at": "document_idle"
    }
    ```

    **Firefox manifest.json:**

    ````json
    {
        "matches": ["*://[service-domain]/*"],
        "js": ["content-scripts/[service-name].js"],
        "run_at": "document_idle"
    }
    ```3. Implement skip detection logic:
    ```javascript
    // Follow existing patterns in netflix.js or crunchyroll.js
    const SERVICE_NAME = "ServiceName";
    const SKIP_SELECTORS = ["service-specific-selectors"];
    ````

3. Add service to `manage.js` DETECTED_SERVICES object in both browser directories
4. Test in both Chrome and Firefox environments

**Improving Detection Logic:**

-   Test skip button selectors on the actual streaming site
-   Add fallback methods for different UI states
-   Ensure compatibility with service UI updates
-   Add proper error handling and logging

**UI/UX Improvements:**

-   Follow existing design patterns
-   Ensure responsive design
-   Test accessibility features
-   Maintain consistent styling

### 📋 Code Standards

#### JavaScript Style

```javascript
// Use strict mode
"use strict";

// Descriptive variable names
const skipIntroButton = document.querySelector('[data-testid="skipIntro"]');

// Error handling
try {
    await performAction();
} catch (error) {
    console.error("[ServiceName] Action failed:", error);
}

// Async/await preferred over promises
async function loadSettings() {
    const result = await chrome.storage.sync.get(["setting"]);
    return result.setting;
}
```

#### File Organization

-   Keep service-specific logic in separate files
-   Use consistent naming conventions
-   Add descriptive comments for complex logic
-   Remove debug code before submitting

#### Testing Checklist

-   [ ] Extension loads without errors in both Chrome and Firefox
-   [ ] Skip functionality works on target service in both browsers
-   [ ] Settings save and load correctly in both browsers
-   [ ] No console errors in production
-   [ ] Firefox-specific: Extension passes `web-ext lint`
-   [ ] Chrome-specific: Extension follows Manifest V3 guidelines
-   [ ] Cross-browser compatibility verified
-   [ ] Doesn't conflict with other extensions



### 🔄 Pull Request Process

1. **Create Feature Branch**

    ```bash
    git checkout -b feature/new-streaming-service
    git checkout -b fix/button-detection-issue
    ```

2. **Make Changes**

    - Follow code standards above
    - Test thoroughly on actual streaming sites in both Chrome and Firefox
    - Update documentation if needed
    - Ensure cross-browser compatibility

3. **Testing Commands**

    **Chrome Testing:**

    ```bash
    # Load unpacked extension in chrome://extensions/
    # Enable Developer Mode and refresh extension after changes
    ```

    **Firefox Testing:**

    ```bash
    cd firefox/
    web-ext run                    # Run in temporary profile
    web-ext lint                   # Check for errors
    web-ext build                  # Build for distribution
    ```

4. **Commit Guidelines**

    ```bash
    git commit -m "feat: add support for Disney+ skip intro"
    git commit -m "fix: improve Netflix button detection in Firefox"
    git commit -m "docs: update installation instructions for both browsers"
    ```

5. **Submit Pull Request**
    - Use descriptive title and description
    - Reference any related issues
    - Include testing notes for both Chrome and Firefox
    - Add screenshots for UI changes
    - Mention any browser-specific considerations


### 📝 Documentation

When contributing, please update:

-   README.md for new features
-   Code comments for complex logic
-   Manifest permissions for new APIs
-   Version number for releases

### 🎖️ Recognition

Contributors will be recognized in:

-   README.md contributors section
-   GitHub contributor graphs

## 🔒 Privacy & Security

-   **No Data Collection**: Extension operates entirely locally
-   **No External Requests**: Works completely offline
-   **Browser Storage Only**: Settings stored in Chrome sync storage
-   **Open Source**: Full code available for review
-   **No Tracking**: Zero analytics or user monitoring

## 📜 License & Credits

-   **GNU GENERAL PUBLIC LICENSE**: Free to use, modify, and distribute
-   **Inspired by**: [Netflix-Prime-Auto-Skip](https://github.com/Dreamlinerm/Netflix-Prime-Auto-Skip)
-   **Not Affiliated**: With Netflix, Crunchyroll, or any streaming service

## 🏆 Contributors

Thank you to all contributors who help improve this extension!

<!-- Contributors will be automatically added here -->

<a href="https://github.com/dsouravcom/intro-skipper-ext/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=dsouravcom/intro-skipper-ext" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

---

## ⚠️ Disclaimer

### 📢 Important Notice

**This extension is NOT affiliated with, endorsed by, or connected to any streaming service including Netflix, Crunchyroll, Hotstar, Prime Video, or any other platform.**

### 🔒 Legal & Compliance

-   **Third-Party Tool**: This is an independent browser extension developed by the community
-   **No Official Support**: Streaming services do not provide support for this extension
-   **Use at Your Own Risk**: Users are responsible for compliance with streaming service terms of service
-   **No Warranties**: Extension provided "as-is" without any guarantees of functionality
-   **Service Changes**: Streaming platforms may update their interfaces, potentially affecting extension functionality

### 🛡️ Terms of Use

-   **Personal Use Only**: Extension intended for personal, non-commercial use
-   **Respect Content**: Users should respect content creators and consider watching introductions when appropriate
-   **No Circumvention**: Extension does not circumvent any security measures or DRM protection
-   **Local Operation**: Extension operates entirely within your browser using publicly available webpage elements

### 📝 Trademark Notice

All streaming service names, logos, and trademarks are the property of their respective owners. Use of these names and logos is for identification purposes only and does not imply endorsement.

---

**Made with ❤️ for the streaming community | Not affiliated with any streaming service**
