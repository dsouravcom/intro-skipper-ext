(function () {
    "use strict";

    // Robust Hotstar intro skipper
    const SERVICE_NAME = "Hotstar";
    const DOMAIN = "hotstar.com";

    // State variables
    let globalEnabled = true;
    let serviceEnabled = true;
    let isSkipping = false;
    let lastSkipTime = 0;
    let checkInterval = null;
    let observer = null;

    // Initialize immediately
    init();

    async function init() {
        try {
            await loadSettings();

            if (shouldSkip()) {
                startChecking();
                setupMessageListener();
            }
        } catch (error) {
            console.error(`[${SERVICE_NAME}] Init failed:`, error);
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
            console.error(`[${SERVICE_NAME}] Failed to load settings:`, error);
            globalEnabled = true;
            serviceEnabled = true;
        }
    }

    function shouldSkip() {
        return globalEnabled && serviceEnabled;
    }

    function startChecking() {
        stopChecking();

        if (!observer) {
            observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (
                        mutation.type === "childList" &&
                        mutation.addedNodes.length > 0
                    ) {
                        clearTimeout(checkInterval);
                        checkInterval = setTimeout(checkForSkipButton, 500);
                        break;
                    }
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });
        }

        checkInterval = setInterval(checkForSkipButton, 5000);
        setTimeout(checkForSkipButton, 500);
    }

    function stopChecking() {
        if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    }

    function checkForSkipButton() {
        if (isSkipping || !shouldSkip()) return;

        const now = Date.now();
        if (now - lastSkipTime < 5000) return;

        const skipButton = findSkipButton();
        if (skipButton && isButtonVisible(skipButton)) {
            skipIntro(skipButton);
        }
    }

    function findSkipButton() {
        const buttons = document.querySelectorAll("button");
        for (const btn of buttons) {
            if (!isButtonVisible(btn)) continue;

            const text = btn.textContent?.toLowerCase().trim();

            // Strict match for intro/recap
            if (text === "skip intro" || text === "skip recap") {
                return btn;
            }

            // Fallback for the specific class from the screenshot
            if (btn.classList.contains("_1CSTLo7uotP5mTlp3jKun7")) {
                if (
                    text &&
                    (text.includes("skip intro") || text.includes("skip recap"))
                ) {
                    return btn;
                }
            }
        }

        // Fallback to data-testid
        const testIdButton = document.querySelector(
            '[data-testid="skip-intro"]'
        );
        if (testIdButton && isButtonVisible(testIdButton)) return testIdButton;

        return null;
    }

    function isButtonVisible(element) {
        if (!element) return false;

        try {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);

            const isVisible =
                rect.width > 0 &&
                rect.height > 0 &&
                style.visibility !== "hidden" &&
                style.display !== "none" &&
                style.opacity !== "0";

            // Skip buttons are small and usually in the bottom half of the screen.
            // This prevents accidentally clicking the "Back" button (top left) or "Close" button.
            const isSmall = rect.width < 300 && rect.height < 100;
            const isInBottomHalf = rect.top > window.innerHeight * 0.5;

            return isVisible && isSmall && isInBottomHalf;
        } catch (error) {
            return false;
        }
    }

    function skipIntro(button) {
        isSkipping = true;
        lastSkipTime = Date.now();

        try {
            console.log(
                `[${SERVICE_NAME}] Found skip button, clicking:`,
                button
            );
            button.click();

            browser.runtime
                .sendMessage({
                    action: "buttonClicked",
                    type: "intro",
                    service: SERVICE_NAME,
                    timestamp: Date.now(),
                })
                .catch(() => {});
        } catch (error) {
            console.error(`[${SERVICE_NAME}] Skip failed:`, error);
        }

        setTimeout(() => {
            isSkipping = false;
        }, 5000);
    }

    function setupMessageListener() {
        browser.runtime.onMessage.addListener(async (request) => {
            if (request.action === "updateSettings") {
                await loadSettings();
                if (!shouldSkip()) {
                    stopChecking();
                } else if (shouldSkip() && !checkInterval) {
                    startChecking();
                }
            }
        });

        browser.storage.onChanged.addListener(async (changes, namespace) => {
            if (namespace === "sync") {
                await loadSettings();
            }
        });
    }

    window.addEventListener("beforeunload", () => {
        stopChecking();
    });
})();
