((namespace) => {
    const excludedTags = ['script', 'style', 'iframe', 'noscript', 'input', 'textarea'];

    const textNodes = [];
    let currentIndex = 0;

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (!node)
                    return;
                
                if (node.parentElement && node.parentElement.tagName && excludedTags.includes(node.parentElement.tagName.toLowerCase())) {
                    return;
                }

                requestAnimationFrame(() =>{
                    findInstances(node);
                    requestAnimationFrame(replaceInstances);
                });
            });
        });
    });
   
    const observ = () => {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    };

    const findInstances = (rootNode) => {
        if (!rootNode) return;

        const treeWalker = document.createTreeWalker(
            rootNode,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (
                        excludedTags.includes(node.parentElement.tagName.toLowerCase())
                    ) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    for(let key in namespace.settings.replacements){
                        if (node.nodeValue.toLowerCase().includes(key.toLowerCase())) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                    }
                    return NodeFilter.FILTER_SKIP;
                },
            },
            false
        );

        let currentNode;
        while ((currentNode = treeWalker.nextNode())) {
            textNodes.push(currentNode);
        }
    }

    const replaceInstances = () => {

        if (currentIndex < textNodes.length){
            const node = textNodes[currentIndex];
            if (node.textContent){
                for(let key in namespace.settings.replacements){
                        const regex = new RegExp("\\b" + key + "\\b", 'gi');
                        node.textContent = node.textContent.replace(regex, (match) => {
                            const replacement = namespace.settings.matchCase ? matchCase(match, namespace.settings.replacements[key]) : namespace.settings.replacements[key];
                            node.match = match;
                            node.replacement = replacement;
    
                            return replacement;
                        })
                }
            }
            currentIndex++;
            requestAnimationFrame(replaceInstances);

        }
    };

    const matchCase = (sourceText, targetText) => {
        let result = "";

        for (let i = 0; i < sourceText.length; i++) {
            const sourceChar = sourceText[i];
            const targetChar = targetText[i % targetText.length];

            if (sourceChar === sourceChar.toUpperCase()) {
                result += targetChar.toUpperCase();
            } else if (sourceChar === sourceChar.toLowerCase()) {
                result += targetChar.toLowerCase();
            }
        }

        if (targetText.length > sourceText.length) {
            result += targetText.slice(sourceText.length).toLowerCase();
        }

        return result;
    };

    const load = async () => {
        const url = new URL(window.location.href);
        const host = url.hostname;

        await namespace.loadSettings();

        if (!namespace.settings.enabledForHost){
            return;
        }

        currentIndex = 0;
        
        observ();
        requestAnimationFrame(() => {
            findInstances(document.body);
            requestAnimationFrame(replaceInstances);
        });
    }

    const reverse = () => {
        if (currentIndex >= 0){
            const node = textNodes[currentIndex];            
            if (node){
                const regex = new RegExp("\\b" + node.replacement + "\\b", 'gi');
                node.textContent = node.textContent.replace(regex, (match) => {
                    return node.match;
                });
            }

            currentIndex--;
            requestAnimationFrame(reverse);
        }
    }

    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {

        switch(message.action){
            case 'suplexer-enable':
                await namespace.loadSettings();
                load();
                break;
            case 'suplexer-disable':
                observer.disconnect();
                currentIndex = textNodes.length - 1;
                reverse();
                break;
            case 'suplexer-reload':
                observer.disconnect();
                currentIndex = textNodes.length - 1;
                while (currentIndex >= 0){
                    const node = textNodes[currentIndex];            
                    if (node){
                        const regex = new RegExp("\\b" + node.replacement + "\\b", 'gi');
                        node.textContent = node.textContent.replace(regex, (match) => {
                            return node.match;
                        });
                    }
                    
                    currentIndex--;
                }

                await namespace.loadSettings();
                load();
                break;
        }

        sendResponse({ success: true });
    });

    load();
})(window.suplexer = window.suplexer || {});