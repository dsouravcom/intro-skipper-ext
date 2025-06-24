// State variables
let globalEnabled = true;

// Dynamically detected services based on current tabs
const DETECTED_SERVICES = {
    "netflix.com": { name: "Netflix" },
    "crunchyroll.com": { name: "Crunchyroll" },
    // Services are added dynamically when user visits them
};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", init);

function init() {
    loadSettings();
    setupMasterToggle();
}

async function loadSettings() {
    try {
        const result = await chrome.storage.sync.get(["globalEnabled"]);
        globalEnabled = result.globalEnabled !== false;

        renderServices();
        updateMasterToggle();
    } catch (error) {
        console.error("Error loading settings:", error);
        showStatus("Failed to load settings", "error");
    }
}

function setupMasterToggle() {
    const masterToggle = document.getElementById("masterToggle");
    if (masterToggle) {
        masterToggle.addEventListener("change", toggleGlobalEnabled);
    }
}

function updateMasterToggle() {
    const masterToggle = document.getElementById("masterToggle");
    if (masterToggle) {
        masterToggle.checked = globalEnabled;
    }
}

async function toggleGlobalEnabled(event) {
    try {
        globalEnabled = event.target.checked;
        await chrome.storage.sync.set({ globalEnabled });

        // Update all service states immediately
        updateAllServiceStates();

        // Notify content scripts
        notifyContentScripts();

        const statusMessage = globalEnabled
            ? "Extension enabled globally"
            : "Extension disabled globally";
        showStatus(statusMessage, "success");
    } catch (error) {
        console.error("Error toggling global setting:", error);
        showStatus("Failed to update global setting", "error");
    }
}

async function renderServices() {
    const container = document.getElementById("servicesContainer");
    container.innerHTML = "";

    // Get service-specific settings
    const serviceKeys = Object.keys(DETECTED_SERVICES).map(
        (domain) => `${domain}_enabled`
    );
    const result = await chrome.storage.sync.get(serviceKeys);

    for (const [domain, serviceData] of Object.entries(DETECTED_SERVICES)) {
        const serviceEnabled = result[`${domain}_enabled`] !== false;
        const serviceCard = createServiceCard(
            domain,
            serviceData,
            serviceEnabled
        );
        container.appendChild(serviceCard);
    }
}

function createServiceCard(domain, serviceData, serviceEnabled) {
    const card = document.createElement("div");

    let cardClasses = "service-card";
    if (!globalEnabled) {
        cardClasses += " disabled";
    } else if (!serviceEnabled) {
        cardClasses += " service-disabled";
    }
    card.className = cardClasses; // Special Crunchyroll settings - removed delay setting since not needed
    let crunchyrollSettings = "";
    if (domain === "crunchyroll.com") {
        crunchyrollSettings = ``;
    }

    card.innerHTML = `
        <div class="service-header">
            <div class="service-info">
                <h3>${serviceData.name}</h3>
                <div class="service-domain">${domain}</div>
            </div>
            <label class="service-toggle">
                <input type="checkbox" ${serviceEnabled ? "checked" : ""} 
                       data-domain="${domain}" class="service-checkbox"
                       ${!globalEnabled ? "disabled" : ""}>
                <span class="toggle-slider"></span>
            </label>
        </div>
        
        <div class="buttons-grid">
            <div class="button-item ${
                !serviceEnabled || !globalEnabled ? "disabled" : ""
            }">
                <div class="button-info">
                    <div class="button-text">Skip Intro</div>
                    <div class="button-type">intro</div>
                </div>
                <div class="button-status">
                    ${serviceEnabled && globalEnabled ? "Enabled" : "Disabled"}
                </div>
            </div>
            <!-- Add more button types here if needed in the future -->
        </div>
        ${crunchyrollSettings}
    `; // Add event listener for service toggle
    const serviceCheckbox = card.querySelector(".service-checkbox");
    if (serviceCheckbox) {
        serviceCheckbox.addEventListener("change", handleServiceToggle);
        serviceCheckbox.addEventListener("click", handleServiceClick);
    }

    return card;
}

function handleServiceToggle(e) {
    if (!e.target.disabled) {
        toggleService(e.target.dataset.domain, e.target.checked);
    }
}

function handleServiceClick(e) {
    if (e.target.disabled) {
        e.preventDefault();
        showStatus(
            "Cannot toggle service - master control is disabled",
            "error"
        );
        return false;
    }
}

async function toggleService(domain, enabled) {
    try {
        if (!globalEnabled) {
            showStatus(
                "Cannot toggle service - master control is disabled",
                "error"
            );
            return;
        }

        await chrome.storage.sync.set({ [`${domain}_enabled`]: enabled });

        // Update UI immediately
        updateServiceButtonStates(domain, enabled);

        // Notify content scripts
        notifyContentScripts();

        const serviceName = DETECTED_SERVICES[domain].name;
        const statusMessage = enabled
            ? `${serviceName} enabled`
            : `${serviceName} disabled`;
        showStatus(statusMessage, "success");
    } catch (error) {
        console.error("Error toggling service:", error);
        showStatus("Failed to update service", "error");
    }
}

function updateServiceButtonStates(domain, serviceEnabled) {
    const serviceCard = document
        .querySelector(`[data-domain="${domain}"]`)
        .closest(".service-card");
    if (!serviceCard) return;

    const buttonItems = serviceCard.querySelectorAll(".button-item");
    const buttonStatus = serviceCard.querySelectorAll(".button-status");

    // Update service card visual state
    if (serviceEnabled) {
        serviceCard.classList.remove("service-disabled");
    } else {
        serviceCard.classList.add("service-disabled");
    }

    buttonItems.forEach((item) => {
        if (serviceEnabled && globalEnabled) {
            item.classList.remove("disabled");
        } else {
            item.classList.add("disabled");
        }
    });

    buttonStatus.forEach((status) => {
        status.textContent =
            serviceEnabled && globalEnabled ? "Enabled" : "Disabled";
    });
}

async function notifyContentScripts() {
    try {
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    action: "updateSettings",
                });
            } catch (error) {
                // Ignore errors for tabs without content script
            }
        }
    } catch (error) {
        console.error("Error notifying content scripts:", error);
    }
}

function showStatus(message, type) {
    const statusEl = document.getElementById("statusMessage");
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `status-message status-${type}`;
        statusEl.style.display = "block";

        setTimeout(() => {
            statusEl.style.display = "none";
        }, 3000);
    }
}

function updateAllServiceStates() {
    const serviceCards = document.querySelectorAll(".service-card");

    serviceCards.forEach((card) => {
        const serviceCheckbox = card.querySelector(".service-checkbox");
        const buttonItems = card.querySelectorAll(".button-item");
        const buttonStatus = card.querySelectorAll(".button-status");

        if (serviceCheckbox) {
            const domain = serviceCheckbox.dataset.domain;
            const serviceEnabled = serviceCheckbox.checked;

            // Update card visual state
            if (!globalEnabled) {
                card.classList.add("disabled");
                card.classList.remove("service-disabled");
            } else {
                card.classList.remove("disabled");
                if (!serviceEnabled) {
                    card.classList.add("service-disabled");
                } else {
                    card.classList.remove("service-disabled");
                }
            }

            // Update service checkbox
            serviceCheckbox.disabled = !globalEnabled;

            // Update button states
            buttonItems.forEach((item) => {
                const shouldBeDisabled = !globalEnabled || !serviceEnabled;
                if (shouldBeDisabled) {
                    item.classList.add("disabled");
                } else {
                    item.classList.remove("disabled");
                }
            });

            buttonStatus.forEach((status) => {
                status.textContent =
                    globalEnabled && serviceEnabled ? "Enabled" : "Disabled";
            });
        }
    });
}
