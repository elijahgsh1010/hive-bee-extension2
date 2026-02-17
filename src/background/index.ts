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
    // Token is passed from content script since localStorage is not available in Service Worker
    if (message.type === 'API_GET_USER_BASIC_INFO') {
        callApi(`/api/userApp/get-user-basic-info`, { method: 'GET' }, message.token)
            .then(res => {
                sendResponse({ success: true, data: res });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true; // Keep the channel open for async response
    }

    if (message.type === 'API_CREATE_CANDIDATE') {
        callApi(`/api/candidateApp/create-candidate-from-linkedin`, { 
            method: 'POST', 
            body: message.payload 
        }, message.token)
            .then(res => {
                sendResponse({ success: true, data: res });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
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

// Helper function to call API with token from content script
async function callApi(endpoint: string, options: any, token?: string) {
    try {
        const headers: Record<string, string> = options.headers || {};
        
        // Add authorization header if token is provided
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${res.status}`);
        }
        
        return await res.json();
    } catch (error) {
        throw error;
    }
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
