// Sample code if using extensionpay.com
// import { extPay } from 'src/utils/payment/extPay'
// extPay.startBackground()

import { $api } from "../utils/api";

type tabMap = { 
    [url: string]: tabInfo;
};
type tabInfo = {
    mainTabId: number;
    experienceTabId: number;
};

const tabRequests: tabMap = {};

chrome.runtime.onInstalled.addListener(async (opt) => {
  // Check if reason is install or update. Eg: opt.reason === 'install' // If extension is installed.
  // opt.reason === 'update' // If extension is updated.
  if (opt.reason === "install") {
    chrome.tabs.create({
      active: true,
      // Open the setup page and append `?type=install` to the URL so frontend
      // can know if we need to show the install page or update page.
      url: chrome.runtime.getURL("src/ui/setup/index.html#/setup/install"),
    })

    return
  }

  if (opt.reason === "update") {
    chrome.tabs.create({
      active: true,
      url: chrome.runtime.getURL("src/ui/setup/index.html#/setup/update"),
    })

    return
  }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("in background listener..", message, tabRequests);
    
    // API Calls moved here to avoid CORS issues
    if (message.type === 'API_GET_USER_BASIC_INFO') {
        // Get token from chrome.storage instead of localStorage (not available in background script)
        chrome.storage.local.get(['hiveAccessToken'], async (result) => {
            try {
                const headers: Record<string, string> = {};
                if (result.hiveAccessToken) {
                    headers['Authorization'] = `Bearer ${result.hiveAccessToken}`;
                }
                
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/userApp/get-user-basic-info`, {
                    method: 'GET',
                    headers
                });
                
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                
                const data = await res.json();
                sendResponse({ success: true, data });
            } catch (error) {
                sendResponse({ success: false, error: (error as Error).message });
            }
        });
        return true; // Keep the channel open for async response
    }

    if (message.type === 'API_CREATE_CANDIDATE') {
        // Get token from chrome.storage instead of localStorage (not available in background script)
        chrome.storage.local.get(['hiveAccessToken'], async (result) => {
            try {
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json'
                };
                if (result.hiveAccessToken) {
                    headers['Authorization'] = `Bearer ${result.hiveAccessToken}`;
                }
                
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/candidateApp/create-candidate-from-linkedin`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(message.payload)
                });
                
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                
                const data = await res.json();
                sendResponse({ success: true, data });
            } catch (error) {
                sendResponse({ success: false, error: (error as Error).message });
            }
        });
        return true; // Keep the channel open for async response
    }
    
    if (message.type === 'LOGIN_TO_HIVE') {
        openTab(message.url, sender?.tab?.id || 0);
        return;
    }
    
    if (message.type === 'SCRAPE_LINKEDIN_EXPERIENCE') {
        openTab(message.url, sender?.tab?.id || 0);
        return;
    }

    const res = tabRequests[message.url];
    
    if(!res) return;
    
    chrome.tabs.sendMessage(res.mainTabId, { type: message.type, data: message.data });
    
    delete tabRequests[message.url];
    chrome.tabs.remove(res?.experienceTabId);

    // Optionally close the background tab
    setTimeout(() => {
        chrome.tabs.remove(res?.experienceTabId);
    }, 15000);

    return false;
});

// open tab in background and rely on content script to scrape & respond
function openTab(url: string, mainTabId: number) {
    chrome.tabs.create(
        {
            url,
            active: false, 
        },
        (tab) => {
            if (!tab.id) {
                return;
            }

            const tabId = tab.id;

            tabRequests[url] = {
                mainTabId: mainTabId,
                experienceTabId: tabId
            };
            setTimeout(() => {chrome.tabs.remove(tabId); }, 60000); 
        },
    );
}

self.onerror = function (message, source, lineno, colno, error) {
  console.info("Error: " + message)
  console.info("Source: " + source)
  console.info("Line: " + lineno)
  console.info("Column: " + colno)
  console.info("Error object: " + error)
}

console.info("hello world from background");

export {}
