(function(){
    let excludedHosts = [];

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          const url = new URL(tabs[0].url);
          const host = url.hostname;
          
          chrome.storage.local.get(['replacements', "exclusions"], function(result) {
            if (result.exclusions !== undefined){
                excludedHosts = result.exclusions;
            }
    
            const chkEnabled = document.getElementById('chkEnabled');
            const slider = document.getElementById('sldEnable');
    
            chkEnabled.checked = !excludedHosts.includes(host);
    
            slider.addEventListener('click', () => {
                chkEnabled.checked = !chkEnabled.checked;
            });

            chkEnabled.addEventListener('change', function() {
    
                if (chkEnabled.checked) {
                    excludedHosts = excludedHosts.filter(item => item !== host);
                } else {
                    excludedHosts.push(host);
                }
    
                chrome.storage.local.set({ 'exclusions': excludedHosts });

                chrome.tabs.sendMessage(tabs[0].id, { action: "reload-suplexer" }, (response) => {
                    if (response && response.success) {
                      console.log("Toggled");
                    }
                  });
            });
            });
          
        }
      });

    
})()