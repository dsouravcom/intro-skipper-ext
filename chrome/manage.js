// Settings page — full control surface for Intro Skipper.

const SERVICES = [
    {
        domain: "netflix.com",
        name: "Netflix",
        icon: "netflix.com",
        color: "#E50914",
        letter: "N",
        blurb: "Skips intros",
    },
    {
        domain: "crunchyroll.com",
        name: "Crunchyroll",
        icon: "crunchyroll.com",
        color: "#F47521",
        letter: "C",
        blurb: "Skips intro, credits & recap",
        types: [
            { key: "intro", label: "Intro", desc: "Opening theme" },
            { key: "credits", label: "Credits", desc: "End credits / outro" },
            {
                key: "preview",
                label: "Preview & Recap",
                desc: "Next-episode preview and recaps",
            },
        ],
    },
    {
        domain: "hotstar.com",
        name: "JioHotstar",
        icon: "hotstar.com",
        color: "#0F1668",
        letter: "J",
        blurb: "Skips intros",
    },
];

function faviconURL(domain) {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

let globalEnabled = true;

document.addEventListener("DOMContentLoaded", init);

async function init() {
    await loadAndRender();
    showVersion();
}

function showVersion() {
    try {
        const el = document.getElementById("appVersion");
        if (el) el.textContent = "v" + chrome.runtime.getManifest().version;
    } catch (e) {
        /* keep the static fallback */
    }
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
    renderServices(store);

    const master = document.getElementById("masterToggle");
    master.checked = globalEnabled;
    master.addEventListener("change", onToggle);
    updateMasterStatus();
    updateStates();
}

function renderServices(store) {
    const container = document.getElementById("services");
    container.innerHTML = SERVICES.map((svc) => {
        const on = store[`${svc.domain}_enabled`] !== false;

        let types = "";
        if (svc.types) {
            types =
                `<div class="types">` +
                svc.types
                    .map((t) => {
                        const tOn =
                            store[`${svc.domain}_skip_${t.key}`] !== false;
                        return `
                        <div class="type-row">
                            <div class="type-meta">
                                <div class="type-label">${t.label}</div>
                                <div class="type-desc">${t.desc}</div>
                            </div>
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

        return `
            <div class="card service-card" data-domain="${svc.domain}">
                <div class="svc-head">
                    <span class="avatar" data-letter="${svc.letter}" data-color="${svc.color}"><img src="${faviconURL(
                        svc.icon,
                    )}" alt="" width="23" height="23"></span>
                    <div class="svc-meta">
                        <div class="svc-name">${svc.name}</div>
                        <div class="svc-sub">${svc.blurb}</div>
                    </div>
                    ${switchHTML(on, { role: "service", domain: svc.domain })}
                </div>
                ${types}
            </div>`;
    }).join("");

    container
        .querySelectorAll(".switch input[data-role]")
        .forEach((el) => el.addEventListener("change", onToggle));
    wireAvatarFallbacks(container);
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
    let message;
    if (role === "master") {
        globalEnabled = checked;
        update = { globalEnabled: checked };
        message = checked ? "Auto-skip enabled" : "Auto-skip paused";
        updateMasterStatus();
    } else if (role === "service") {
        const name = serviceName(el.dataset.domain);
        update = { [`${el.dataset.domain}_enabled`]: checked };
        message = `${name} ${checked ? "enabled" : "disabled"}`;
    } else if (role === "type") {
        update = { [`${el.dataset.domain}_skip_${el.dataset.type}`]: checked };
        message = `${el.dataset.type} skip ${checked ? "on" : "off"}`;
    }

    try {
        await chrome.storage.sync.set(update);
    } catch (err) {
        el.checked = !checked;
        showToast("Couldn't save — try again");
        return;
    }
    notifyContentScripts();
    updateStates();
    showToast(message);
}

function updateStates() {
    document.querySelectorAll(".service-card").forEach((card) => {
        const svcInput = card.querySelector('[data-role="service"]');
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
    document.getElementById("masterStatus").textContent = globalEnabled
        ? "Master switch — on everywhere"
        : "Master switch — everything paused";
}

function serviceName(domain) {
    const svc = SERVICES.find((s) => s.domain === domain);
    return svc ? svc.name : domain;
}

let toastTimer = null;
function showToast(text) {
    const toast = document.getElementById("toast");
    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
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
