((namespace) => {

    const settings = {
        excludedHosts: [],
        replacements: [],
        matchCase: true,
        enabledForHost: true,
        hostName: "",
    }

    const defaultReplacements = {
        "slammed": "suplexed",
        "slams": "suplexes",
        "slam": "SUPLEX",
    };

    const getHostName = async () => {
        if (chrome.tabs){
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs.length === 0) return;

            const url = new URL(tabs[0].url);
            return url.hostname;
        } else {
            const url = new URL(window.location.href);
            return url.hostname;
        }
    };

    const loadSettings = async () => {  

        settings.hostName = await getHostName();

        const result = await chrome.storage.local.get(['replacements', "exclusions", "matchCase"]);

        if (result.exclusions) {
            settings.excludedHosts = result.exclusions;
            settings.enabledForHost = !settings.excludedHosts.includes(settings.hostName);
        }

        if (result.replacements) {
            settings.replacements = result.replacements;
        } else {
            settings.replacements = defaultReplacements;
        }

        if (result.matchCase !== undefined) {
            settings.matchCase = result.matchCase;
        }
    };

    const saveSettings = async () => { 
        await chrome.storage.local.set({
            'replacements': settings.replacements,
            'exclusions': settings.excludedHosts,
            'matchCase': settings.matchCase
        });
    };

    namespace.settings = settings;
    namespace.loadSettings = loadSettings;
    namespace.saveSettings = saveSettings;

})(window.suplexer = window.suplexer || {});