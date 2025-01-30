(async (namespace) => {

  await namespace.loadSettings();

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length === 0) return;

  const url = new URL(tabs[0].url);
  const host = url.hostname;

  const chkEnabled = document.getElementById('chkEnabled');
  chkEnabled.checked = namespace.settings.enabledForHost;
  
  const chkMatchCase = document.getElementById('chkMatchCase');
  chkMatchCase.checked = namespace.settings.matchCase;

  chkEnabled.addEventListener('change', async function() {
    {

      if (chkEnabled.checked) {
        namespace.settings.excludedHosts = namespace.settings.excludedHosts.filter(item => item !== host);
      } else {
        namespace.settings.excludedHosts.push(host);
      }
  
      await namespace.saveSettings();
      await namespace.loadSettings();
  
      try {
        const response = await chrome.tabs.sendMessage(tabs[0].id, { action: chkEnabled.checked ? "suplexer-enable" : "suplexer-disable" });
        if (response && response.success) {
          console.log("Toggled Suplexer.");
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  });

  chkMatchCase.addEventListener('change', async function() {
    {
      namespace.settings.matchCase = chkMatchCase.checked;
  
      await namespace.saveSettings();
      await namespace.loadSettings();
  
      try {
        const response = await chrome.tabs.sendMessage(tabs[0].id, { action: "suplexer-reload" });
        if (response && response.success) {
          console.log("Toggled Suplexer.");
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  });

})(window.suplexer = window.suplexer || {});