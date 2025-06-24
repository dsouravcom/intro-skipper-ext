(function () {
    "use strict";

    // Robust Crunchyroll intro skipper
    const SERVICE_NAME = "Crunchyroll";
    const DOMAIN = "crunchyroll.com"; // State variables
    let globalEnabled = true;
    let serviceEnabled = true;
    let isSkipping = false;
    let lastSkipTime = 0;
    let checkInterval = null;
    let observer = null; // MutationObserver for efficient DOM watching

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
            console.error("[Crunchyroll] Init failed:", error);
        }
    }
    async function loadSettings() {
        try {
            const result = await chrome.storage.sync.get([
                "globalEnabled",
                `${DOMAIN}_enabled`,
            ]);

            globalEnabled = result.globalEnabled !== false;
            serviceEnabled = result[`${DOMAIN}_enabled`] !== false;
        } catch (error) {
            console.error("[Crunchyroll] Failed to load settings:", error);
            // Fallback to defaults
            globalEnabled = true;
            serviceEnabled = true;
        }
    }

    function shouldSkip() {
        return globalEnabled && serviceEnabled;
    }
    function startChecking() {
        // Stop any existing checking
        stopChecking();

        // Use MutationObserver for efficient DOM monitoring
        if (!observer) {
            observer = new MutationObserver((mutations) => {
                // Only check when new elements are added that might be skip buttons
                for (const mutation of mutations) {
                    if (
                        mutation.type === "childList" &&
                        mutation.addedNodes.length > 0
                    ) {
                        // Debounce: only check once every 500ms even if multiple changes occur
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

        // Also do periodic checks as fallback (every 5 seconds instead of 2)
        checkInterval = setInterval(checkForSkipButton, 5000);

        // Check immediately after a short delay
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
        if (now - lastSkipTime < 5000) return; // Prevent rapid clicking

        // Find skip button using multiple detection methods
        const skipButton = findSkipButton();

        if (skipButton && isButtonVisible(skipButton)) {
            skipIntro(skipButton);
        }
    }
    function findSkipButton() {
        // Method 1: Crunchyroll's primary skip button selector (fastest)
        let button = document.querySelector('[data-testid="skipIntroText"]');
        if (button) {
            return button;
        }

        // Method 2: Optimized selectors (combine multiple selectors in one query)
        button = document.querySelector(
            'button[aria-label*="skip" i], button[class*="skip"], [class*="skip-intro"], [class*="skipintro"], [role="button"][class*="skip"]'
        );
        if (button) {
            const text = (
                button.textContent ||
                button.innerText ||
                ""
            ).toLowerCase();
            if (text.includes("skip") || text.includes("intro")) {
                return button;
            }
        }

        // Method 3: Limited text search (only check buttons and role=button, not all clickable elements)
        const clickableButtons = document.querySelectorAll(
            'button, [role="button"]'
        );
        for (const element of clickableButtons) {
            const text = (element.textContent || element.innerText || "")
                .trim()
                .toLowerCase();
            if (
                text === "skip intro" ||
                text === "skip" ||
                text === "skip opening"
            ) {
                return element;
            }
        }

        // Method 4: Skip the expensive "all elements" search for better performance
        // (This was the most resource-intensive part - searching ALL DOM elements)        return null;
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
                style.opacity !== "0" &&
                rect.top >= 0 &&
                rect.left >= 0;

            return isVisible;
        } catch (error) {
            console.error("[Crunchyroll] Error checking visibility:", error);
            return false;
        }
    }
    function skipIntro(button) {
        isSkipping = true;
        lastSkipTime = Date.now();

        // Skip immediately without delay
        try {
            // Try multiple click methods for maximum compatibility
            button.click();
            button.dispatchEvent(
                new MouseEvent("click", { bubbles: true, cancelable: true })
            );
            button.dispatchEvent(
                new MouseEvent("mousedown", { bubbles: true })
            );
            button.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

            // Try focusing and pressing Enter
            if (button.focus) button.focus();
            button.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "Enter",
                    bubbles: true,
                })
            );
            console.log("[Crunchyroll] ✅ Intro skipped!");

            // Notify background script
            chrome.runtime
                .sendMessage({
                    action: "buttonClicked",
                    type: "intro",
                    service: SERVICE_NAME,
                    timestamp: Date.now(),
                })
                .catch(() => {});
        } catch (error) {
            console.error("[Crunchyroll] Skip failed:", error);
        }

        // Reset after delay to allow for next skip
        setTimeout(() => {
            isSkipping = false;
        }, 3000);
    }

    function setupMessageListener() {
        chrome.runtime.onMessage.addListener(
            async (request, sender, sendResponse) => {
                if (request.action === "updateSettings") {
                    try {
                        await loadSettings();

                        if (!shouldSkip()) {
                            stopChecking();
                        } else if (shouldSkip() && !checkInterval) {
                            startChecking();
                        }
                    } catch (error) {
                        console.error(
                            "[Crunchyroll] Failed to update settings:",
                            error
                        );
                    }
                }
            }
        );

        chrome.storage.onChanged.addListener(async (changes, namespace) => {
            if (namespace === "sync") {
                await loadSettings();
            }
        });
    }
    function destroy() {
        stopChecking();
    } // Cleanup on page unload
    window.addEventListener("beforeunload", destroy);
})();
