(function(){
    const excludedTags = ['script', 'style', 'iframe', 'noscript', 'input', 'textarea'];

    const defaultReplacements = {
        "slammed": "suplexed",
        "slams": "suplexes",
        "slam": "suplex",
    };

    let replacements = null;
    let excludedHosts = [];

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
                    for(let key in replacements){
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

            for(let key in replacements){
                    const regex = new RegExp("\\b" + key + "\\b", 'gi');
                    node.textContent = node.textContent.replace(regex, (match) => {
                        const replacement = matchCase(match, replacements[key])
                        node.match = match;
                        node.replacement = replacement;

                        return replacement;
                    })
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

    const load = () => {

        const url = new URL(window.location.href);
        const host = url.hostname;

        chrome.storage.local.get(['replacements', "exclusions"], function(result) {
            if (result.exclusions !== undefined){
                excludedHosts = result.exclusions;
            }

            if (excludedHosts.includes(host)){
                return;
            }

            observ();

            if (result.replacements !== undefined) {
                replacements = result.replacements;
            } else {
                replacements = defaultReplacements;
                chrome.storage.local.set({ 'replacements': replacements });
            }

            requestAnimationFrame(() => {
                findInstances(document.body);
                requestAnimationFrame(replaceInstances);
            });
        });
    }

    const reverse = () => {
        if (currentIndex >= 0){
            const node = textNodes[currentIndex];            
            if (node){
                const regex = new RegExp("\\b" + node.replacement + "\\b", 'gi');
                node.textContent = node.textContent.replace(regex, (match) => {
                    console.log(`replaceing '${node.replacement}' with '${node.match}'`)
                    return node.match;
                });
            }

            currentIndex--;
            requestAnimationFrame(reverse);
        }
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "reload-suplexer") {
            if (currentIndex > 0) {
                observer.disconnect();
                currentIndex = textNodes.length - 1;
                reverse();
            } else {
                observ();
                load();
            }
            sendResponse({ success: true });
        }
    });

    load();
})()