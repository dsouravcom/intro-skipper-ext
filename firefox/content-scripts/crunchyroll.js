(function () {
    "use strict";

    // ─────────────────────────────────────────────────────────────────────────
    // Crunchyroll intro / credits / preview skipper (Firefox build)
    //
    // Crunchyroll's modern player renders the <video> directly in the top
    // document and exposes precise skip markers via a public static endpoint:
    //
    //   https://static.crunchyroll.com/skip-events/production/<mediaId>.json
    //   → { intro: {start,end}, credits: {start,end}, preview: {...}, recap: {...} }
    //
    // We fetch those markers and simply seek `video.currentTime` to the end of a
    // segment when playback enters it — exactly what Crunchyroll's own "Skip"
    // button does internally. This means:
    //   • No synthetic clicks (the player ignores them anyway).
    //   • No fake mouse events, so the player controls never light up.
    //   • Each skip type is gated by its own setting, so the toggles work.
    // ─────────────────────────────────────────────────────────────────────────

    const DOMAIN = "crunchyroll.com";
    const SERVICE_NAME = "Crunchyroll";
    const TAG = "[Intro Skipper][Crunchyroll]";

    const SKIP_EVENTS_URL = (id) =>
        `https://static.crunchyroll.com/skip-events/production/${id}.json`;

    // Each user-facing toggle maps to one or more skip-event types.
    // "preview" covers both the next-episode preview and the previous-episode recap.
    const GROUP_TYPES = {
        intro: ["intro"],
        credits: ["credits"],
        preview: ["preview", "recap"],
    };
    const TYPE_TO_GROUP = {};
    for (const [group, types] of Object.entries(GROUP_TYPES)) {
        for (const type of types) TYPE_TO_GROUP[type] = group;
    }

    // How close to a segment's end still counts as "inside" it. Keeps us from
    // seeking when playback is already essentially past the segment.
    const INSIDE_MARGIN = 0.3;
    // Re-arm a segment once the viewer rewinds this far before its start, so a
    // deliberate rewind past a segment lets us skip it again on re-entry.
    const REARM_MARGIN = 1.5;

    // ── Settings ────────────────────────────────────────────────────────────
    let globalEnabled = true;
    let serviceEnabled = true;
    const groupEnabled = { intro: true, credits: true, preview: true };

    // ── Per-media state ───────────────────────────────────────────────────────
    let mediaId = null;
    let segments = []; // [{ group, type, start, end, armed }]
    let video = null;
    let timeUpdateHandler = null;
    let lastHref = null;
    let tickTimer = null;

    init();

    async function init() {
        try {
            await loadSettings();
            watchSettings();
            hookNavigation();
            await handleLocation(); // set up the current page immediately
        } catch (error) {
            console.error(`${TAG} init failed:`, error);
        }
    }

    // ── Settings ──────────────────────────────────────────────────────────────
    async function loadSettings() {
        try {
            const result = await browser.storage.sync.get([
                "globalEnabled",
                `${DOMAIN}_enabled`,
                `${DOMAIN}_skip_intro`,
                `${DOMAIN}_skip_credits`,
                `${DOMAIN}_skip_preview`,
            ]);
            globalEnabled = result.globalEnabled !== false;
            serviceEnabled = result[`${DOMAIN}_enabled`] !== false;
            groupEnabled.intro = result[`${DOMAIN}_skip_intro`] !== false;
            groupEnabled.credits = result[`${DOMAIN}_skip_credits`] !== false;
            groupEnabled.preview = result[`${DOMAIN}_skip_preview`] !== false;
        } catch (error) {
            // Fail open: default everything to enabled.
            globalEnabled = true;
            serviceEnabled = true;
            groupEnabled.intro = true;
            groupEnabled.credits = true;
            groupEnabled.preview = true;
        }
    }

    function isActive() {
        return globalEnabled && serviceEnabled;
    }

    function watchSettings() {
        // Settings live in browser.storage.sync; react to any change so toggles
        // in the options page take effect on the open player instantly.
        browser.storage.onChanged.addListener((changes, area) => {
            if (area === "sync") loadSettings();
        });
        browser.runtime.onMessage.addListener((request) => {
            if (request && request.action === "updateSettings") loadSettings();
        });
    }

    // ── SPA navigation ─────────────────────────────────────────────────────────
    // Crunchyroll is a single-page app: moving between episodes changes the URL
    // and swaps the video source without a full reload. Track that.
    function hookNavigation() {
        const notify = () => queueMicrotask(handleLocation);
        for (const method of ["pushState", "replaceState"]) {
            const original = history[method];
            history[method] = function () {
                const result = original.apply(this, arguments);
                notify();
                return result;
            };
        }
        window.addEventListener("popstate", notify);

        // Single low-frequency heartbeat: detect navigations we didn't intercept,
        // re-hook the <video> if Crunchyroll swapped it, and act as a fallback in
        // case `timeupdate` is throttled in a background tab.
        tickTimer = setInterval(tick, 1000);
    }

    function tick() {
        if (location.href !== lastHref) {
            handleLocation();
            return;
        }
        if (!segments.length) return;
        const current = document.querySelector("video");
        if (current && current !== video) hookVideo();
        maybeSkip();
    }

    function getWatchMediaId() {
        const match = location.pathname.match(/\/watch\/([^/]+)/);
        return match ? match[1] : null;
    }

    async function handleLocation() {
        lastHref = location.href;
        const id = getWatchMediaId();
        if (!id) {
            teardown();
            return;
        }
        if (id === mediaId) {
            hookVideo();
            return;
        }

        teardown();
        mediaId = id;

        const data = await fetchSkipEvents(id);
        if (id !== mediaId) return; // navigated away while fetching

        segments = buildSegments(data);
        if (segments.length) {
            hookVideo();
        } else {
            console.info(`${TAG} no skip markers for ${id}`);
        }
    }

    // ── Skip data ──────────────────────────────────────────────────────────────
    async function fetchSkipEvents(id) {
        // Prefer the background script (bypasses CORS via host permissions);
        // fall back to a direct fetch (the endpoint allows cross-origin reads).
        try {
            const response = await browser.runtime.sendMessage({
                type: "FETCH_SKIP_EVENTS",
                mediaId: id,
            });
            if (response && response.ok) return response.data;
        } catch (error) {
            // Background unavailable — fall through.
        }
        try {
            const res = await fetch(SKIP_EVENTS_URL(id), {
                credentials: "omit",
            });
            if (res.ok) return await res.json();
        } catch (error) {
            // Network/CORS failure — no skip data available.
        }
        return null;
    }

    function buildSegments(data) {
        if (!data || typeof data !== "object") return [];
        const result = [];
        for (const [key, value] of Object.entries(data)) {
            if (!value || typeof value !== "object") continue;
            const type = String(value.type || key).toLowerCase();
            const group = TYPE_TO_GROUP[type];
            if (!group) continue;
            const start = Number(value.start);
            const end = Number(value.end);
            if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
            if (end <= start) continue;
            result.push({ group, type, start, end, armed: true });
        }
        return result;
    }

    // ── Video hookup ───────────────────────────────────────────────────────────
    function hookVideo() {
        const current = document.querySelector("video");
        if (!current) return; // not ready yet; the heartbeat will retry
        if (current === video && timeUpdateHandler) return; // already hooked

        detachVideo();
        video = current;
        timeUpdateHandler = () => maybeSkip();
        // `timeupdate` fires ~4x/sec during playback — responsive and cheap.
        video.addEventListener("timeupdate", timeUpdateHandler);
    }

    function detachVideo() {
        if (video && timeUpdateHandler) {
            video.removeEventListener("timeupdate", timeUpdateHandler);
        }
        video = null;
        timeUpdateHandler = null;
    }

    // ── The skip itself ──────────────────────────────────────────────────────────
    function maybeSkip() {
        if (!video || video.paused || !segments.length || !isActive()) return;
        const time = video.currentTime;
        if (!Number.isFinite(time)) return;

        for (const segment of segments) {
            // Re-arm if the viewer has moved back before this segment.
            if (!segment.armed && time < segment.start - REARM_MARGIN) {
                segment.armed = true;
            }
            if (!segment.armed) continue;
            if (!groupEnabled[segment.group]) continue;

            if (time >= segment.start && time < segment.end - INSIDE_MARGIN) {
                segment.armed = false;
                performSkip(segment);
                break; // at most one skip per tick
            }
        }
    }

    function performSkip(segment) {
        try {
            // Seek exactly like Crunchyroll's own Skip button — no clicks, no
            // synthetic mouse events, so the player controls stay hidden.
            video.currentTime = segment.end;
            console.log(
                `${TAG} skipped ${segment.type} ` +
                    `(${Math.round(segment.start)}s → ${Math.round(segment.end)}s)`,
            );
            browser.runtime
                .sendMessage({
                    action: "buttonClicked",
                    type: segment.group,
                    service: SERVICE_NAME,
                    timestamp: Date.now(),
                })
                .catch(() => {});
        } catch (error) {
            console.error(`${TAG} skip failed:`, error);
        }
    }

    // ── Cleanup ────────────────────────────────────────────────────────────────
    function teardown() {
        detachVideo();
        segments = [];
        mediaId = null;
    }

    window.addEventListener("beforeunload", () => {
        teardown();
        if (tickTimer) clearInterval(tickTimer);
    });
})();
