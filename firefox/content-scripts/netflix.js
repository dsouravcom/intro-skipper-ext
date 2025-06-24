(function () {
    "use strict";

    // Configuration
    const SERVICE_NAME = "Netflix";
    const DOMAIN = "netflix.com";

    // Skip Intro button selectors
    const SKIP_INTRO_SELECTORS = [
        '[data-uia="player-skip-intro"]',
        'button[data-uia*="skip"]',
        ".skip-intro-button",
    ];

    // Add more button types here if needed in the future:
    // const SKIP_CREDITS_SELECTORS = ['.next-episode-button', ...];
    // const NEXT_EPISODE_SELECTORS = ['.watch-video--next-episode', ...];

    // State variables
    let isSkipping = false;
    let observer = null;
    let globalEnabled = true;
    let serviceEnabled = true;

    // Initialize
    init();

    async function init() {
        try {
            await loadSettings();
            if (shouldSkip()) {
                startWatching();
                setupMessageListener();
            }
        } catch (error) {
            console.error("[Netflix] Initialization failed:", error);
        }
    }

    async function loadSettings() {
        try {
            const result = await browser.storage.sync.get([
                "globalEnabled",
                `${DOMAIN}_enabled`,
            ]);

            globalEnabled = result.globalEnabled !== false;
            serviceEnabled = result[`${DOMAIN}_enabled`] !== false;
        } catch (error) {
            console.error("[Netflix] Failed to load settings:", error);
            // Default to enabled if storage fails
            globalEnabled = true;
            serviceEnabled = true;
        }
    }

    function shouldSkip() {
        return globalEnabled && serviceEnabled;
    }

    function startWatching() {
        if (observer) {
            observer.disconnect();
        }

        observer = new MutationObserver(() => {
            if (shouldSkip()) {
                findAndClickSkipIntro();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        // Initial check
        findAndClickSkipIntro();
    }

    function findAndClickSkipIntro() {
        if (isSkipping) return;

        // Try Netflix-specific selectors first
        let button = null;
        for (const selector of SKIP_INTRO_SELECTORS) {
            try {
                button = document.querySelector(selector);
                if (button && isButtonVisible(button)) {
                    break;
                }
            } catch (e) {
                // Invalid selector, continue
            }
        }

        // Fallback to text-based search
        if (!button) {
            const allButtons = document.querySelectorAll(
                'button, [role="button"]'
            );
            for (const btn of allButtons) {
                if (isButtonVisible(btn)) {
                    const buttonText = getButtonText(btn);
                    if (textMatches(buttonText, "Skip Intro")) {
                        button = btn;
                        break;
                    }
                }
            }
        }

        if (button) {
            clickButton(button);
        }
    }

    // Add more button finding functions here if needed:
    // function findAndClickSkipCredits() { ... }
    // function findAndClickNextEpisode() { ... }

    function isButtonVisible(button) {
        return (
            button &&
            button.offsetParent !== null &&
            button.offsetWidth > 0 &&
            button.offsetHeight > 0
        );
    }

    function getButtonText(button) {
        return (button.textContent || button.innerText || "").trim();
    }

    function textMatches(buttonText, targetText) {
        const text = buttonText.toLowerCase();
        const target = targetText.toLowerCase();
        return text.includes(target);
    }

    function clickButton(button) {
        if (isSkipping) return;

        isSkipping = true;

        setTimeout(() => {
            try {
                if (button && typeof button.click === "function") {
                    button.click();

                    // Notify background script
                    browser.runtime
                        .sendMessage({
                            action: "buttonClicked",
                            type: "intro",
                            service: SERVICE_NAME,
                            timestamp: Date.now(),
                        })
                        .catch(() => {
                            // Ignore message errors
                        });
                }
            } catch (error) {
                console.error(`[${SERVICE_NAME}] Click failed:`, error);
            }

            // Reset skip flag
            setTimeout(() => {
                isSkipping = false;
            }, 3000);
        }, 500);
    }

    function setupMessageListener() {
        browser.runtime.onMessage.addListener(
            async (request, sender, sendResponse) => {
                if (request.action === "updateSettings") {
                    try {
                        await loadSettings();

                        if (!shouldSkip() && observer) {
                            observer.disconnect();
                            observer = null;
                        } else if (shouldSkip() && !observer) {
                            startWatching();
                        }
                    } catch (error) {
                        console.error(
                            "[Netflix] Failed to update settings:",
                            error
                        );
                    }
                }
            }
        );

        // Listen for storage changes
        browser.storage.onChanged.addListener(async (changes, namespace) => {
            if (namespace === "sync") {
                await loadSettings();
            }
        });
    }

    function destroy() {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    }

    // Cleanup on page unload
    window.addEventListener("beforeunload", destroy);
})();
