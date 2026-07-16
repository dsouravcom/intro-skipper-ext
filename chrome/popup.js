// Popup — shows controls for the site you're currently on.

const SERVICES = [
    {
        domain: "netflix.com",
        name: "Netflix",
        icon: "netflix.com",
        letter: "N",
        color: "#E50914",
        blurb: "Skips intros",
    },
    {
        domain: "crunchyroll.com",
        name: "Crunchyroll",
        icon: "crunchyroll.com",
        letter: "C",
        color: "#F47521",
        blurb: "Skips intro, credits & recap",
        types: [
            { key: "intro", label: "Intro" },
            { key: "credits", label: "Credits" },
            { key: "preview", label: "Preview & Recap" },
        ],
    },
    {
        domain: "hotstar.com",
        name: "JioHotstar",
        icon: "hotstar.com",
        letter: "J",
        color: "#0F1668",
        blurb: "Skips intros",
    },
];

let globalEnabled = true;

document.addEventListener("DOMContentLoaded", init);

async function init() {
    document
        .getElementById("openSettings")
        .addEventListener("click", openSettings);
    await loadAndRender();
}

function faviconURL(domain) {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

async function loadAndRender() {
    const keys = ["globalEnabled"];
    for (const svc of SERVICES) {
        keys.push(`${svc.domain}_enabled`);
        for (const t of svc.types || []) keys.push(`${svc.domain}_skip_${t.key}`);
    }

    let store = {};
    try {
        store = await chrome.storage.sync.get(keys);
    } catch (e) {
        /* defaults (all on) */
    }

    globalEnabled = store.globalEnabled !== false;
    const master = document.getElementById("masterToggle");
    master.checked = globalEnabled;
    master.addEventListener("change", onToggle);
    updateMasterStatus();

    const active = await getActiveService();
    renderBody(store, active);
}

async function getActiveService() {
    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        if (!tab || !tab.url) return { status: "unknown" };
        const host = new URL(tab.url).hostname;
        const svc = SERVICES.find((s) => host.endsWith(s.domain));
        return svc ? { status: "match", svc } : { status: "nomatch" };
    } catch (e) {
        return { status: "error" };
    }
}

function renderBody(store, active) {
    const container = document.getElementById("services");

    // Not on a supported streaming site → friendly empty state.
    if (active.status === "nomatch" || active.status === "unknown") {
        container.innerHTML = `
            <div class="empty">
                <div class="empty-icon" aria-hidden="true">📺</div>
                <div class="empty-title">Nothing to skip here</div>
                <div class="empty-text">Open Netflix, Crunchyroll or JioHotstar and this popup will show its controls.</div>
            </div>`;
        return;
    }

    // On a supported site → just that site. If detection failed, show all.
    const list =
        active.status === "match" ? [active.svc] : SERVICES.slice();

    container.innerHTML = list
        .map((svc) => cardHTML(store, svc, active.status === "match"))
        .join("");

    container
        .querySelectorAll(".switch input[data-role]")
        .forEach((el) => el.addEventListener("change", onToggle));
    wireAvatarFallbacks(container);
    updateStates();
}

function cardHTML(store, svc, isActiveTab) {
    const on = store[`${svc.domain}_enabled`] !== false;

    let types = "";
    if (svc.types) {
        types =
            `<div class="types">` +
            svc.types
                .map((t) => {
                    const tOn = store[`${svc.domain}_skip_${t.key}`] !== false;
                    return `
                    <div class="type-row">
                        <span class="type-label">${t.label}</span>
                        ${switchHTML(tOn, {
                            role: "type",
                            domain: svc.domain,
                            type: t.key,
                        })}
                    </div>`;
                })
                .join("") +
            `</div>`;
    }

    const pill = isActiveTab
        ? `<span class="pill">This tab</span>`
        : "";

    return `
        <div class="service-card${isActiveTab ? " here" : ""}" data-domain="${svc.domain}">
            <div class="svc-head">
                ${avatarHTML(svc)}
                <div class="svc-meta">
                    <div class="svc-name">${svc.name} ${pill}</div>
                    <div class="svc-sub">${svc.blurb}</div>
                </div>
                ${switchHTML(on, { role: "service", domain: svc.domain })}
            </div>
            ${types}
        </div>`;
}

function avatarHTML(svc) {
    return `<span class="avatar" data-letter="${svc.letter}" data-color="${svc.color}"><img src="${faviconURL(
        svc.icon,
    )}" alt="" width="22" height="22"></span>`;
}

function wireAvatarFallbacks(container) {
    container.querySelectorAll(".avatar img").forEach((img) => {
        img.addEventListener("error", () => {
            const tile = img.parentElement;
            tile.classList.add("fallback");
            tile.style.background = tile.dataset.color;
            tile.textContent = tile.dataset.letter; // replaces the broken image
        });
    });
}

function switchHTML(checked, data) {
    const attrs = Object.entries(data)
        .map(([k, v]) => `data-${k}="${v}"`)
        .join(" ");
    const label =
        data.role === "service" ? `Enable ${data.domain}` : `Skip ${data.type}`;
    return `<label class="switch"><input type="checkbox" ${
        checked ? "checked" : ""
    } ${attrs} aria-label="${label}"><span class="track"></span></label>`;
}

async function onToggle(e) {
    const el = e.target;
    const role = el.dataset.role;
    const checked = el.checked;

    let update;
    if (role === "master") {
        globalEnabled = checked;
        update = { globalEnabled: checked };
        updateMasterStatus();
    } else if (role === "service") {
        update = { [`${el.dataset.domain}_enabled`]: checked };
    } else if (role === "type") {
        update = {
            [`${el.dataset.domain}_skip_${el.dataset.type}`]: checked,
        };
    }

    try {
        await chrome.storage.sync.set(update);
    } catch (err) {
        el.checked = !checked; // revert on failure
        return;
    }
    notifyContentScripts();
    updateStates();
}

// Update dim / disabled states without rebuilding (keeps switch animations smooth).
function updateStates() {
    document.querySelectorAll(".service-card").forEach((card) => {
        const svcInput = card.querySelector('[data-role="service"]');
        if (!svcInput) return;
        const svcOn = svcInput.checked;
        svcInput.disabled = !globalEnabled;
        card.classList.toggle("dim", !globalEnabled);

        card.querySelectorAll(".type-row").forEach((row) => {
            const input = row.querySelector('[data-role="type"]');
            const active = globalEnabled && svcOn;
            input.disabled = !active;
            row.classList.toggle("dim", !active);
        });
    });
}

function updateMasterStatus() {
    const status = document.getElementById("masterStatus");
    status.textContent = globalEnabled ? "Auto-skip is on" : "Auto-skip is off";
    status.classList.toggle("on", globalEnabled);
}

async function notifyContentScripts() {
    try {
        const tabs = await chrome.tabs.query({});
        await Promise.allSettled(
            tabs.map((tab) =>
                chrome.tabs
                    .sendMessage(tab.id, { action: "updateSettings" })
                    .catch(() => {}),
            ),
        );
    } catch (e) {
        /* ignore */
    }
}

function openSettings() {
    if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
    else chrome.tabs.create({ url: chrome.runtime.getURL("manage.html") });
    window.close();
}
