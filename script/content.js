(function(){
    const excludedTags = ['script', 'style', 'iframe', 'noscript', 'input', 'textarea'];

    const defaultReplacements = {
        "slammed": "suplexed",
        "slams": "suplexes",
        "slam": "suplex",
    };

    let replacements = null;

    const textNodes = [];
    let currentIndex = 0;

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
               
                if (node.parentElement.tagName && excludedTags.includes(node.parentElement.tagName.toLowerCase())) {
                    return;
                }

                requestAnimationFrame(() =>{
                    findInstances(node);
                    requestAnimationFrame(replaceInstances);
                });
            });
        });
    });
   
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

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
                    return matchCase(match, replacements[key]);
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
            } else {
                result += targetChar.toLowerCase();
            }
        }

        if (targetText.length > sourceText.length) {
            result += targetText.slice(sourceText.length).toLowerCase();
        }

        return result;
    };

    const load = () => {

        chrome.storage.local.get(['replacements'], function(result) {
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

    load();
})()