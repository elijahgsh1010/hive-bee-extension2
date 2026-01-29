import "./index.scss";
import { name } from "~/package.json";
import {json} from "node:stream/consumers";
import { useBrowserLocalStorage } from "../composables/useBrowserStorage"

let isIframeVisible = false;
var hasOpenedExperienceTab = false;

function onUrlChange(newUrl: string) {
  console.log("onUrlChange", newUrl);
  
  const isOnProfilePage = document.getElementById("profile-content") !== null;

  chrome.runtime.sendMessage({
    type: "URL_CHANGED",
    url: newUrl,
    isOnProfilePage: isOnProfilePage,
  });
}

function injectIframe() {
    
  const src = chrome.runtime.getURL("src/ui/content-script-iframe/index.html");

  const container = document.createElement("div");
  container.setAttribute("id", "draggable-container");
  container.className = "draggable-container";

  chrome.storage.local.get('showPanel', function (result) {
    console.log('Value currently is ' + result.showPanel);
    if(!result.showPanel){
      container.style.display = "none"
    }
  });   

  const header = document.createElement("div");
  header.className = "iframe-header";
  header.innerHTML = `
    <span>${name}</span>
    <button id="minimize-btn">X</button>
  `;
    
  const iframe = document.createElement("iframe");
  iframe.src = src;
  iframe.className = "draggable-iframe";
  iframe.title = name;

  container.appendChild(header);
  container.appendChild(iframe);

  document.body.appendChild(container);

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener("mousedown", (e) => {
    isDragging = true;
    const rect = container.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
  });

  window.addEventListener("mousemove", (e) => {
    if (isDragging) {
      container.style.left = `${e.clientX - offsetX}px`;
      container.style.top = `${e.clientY - offsetY}px`;
    }
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
  });

  window.addEventListener("message", (event) => {
    if(event.data.type === "GET_LINKEDIN_USER_PROFILE") {
    
      const nameLink = document.querySelector<HTMLAnchorElement>('a[href*="/overlay/about-this-profile/"]');
      const name = nameLink?.getAttribute("aria-label") ?? null;

      const designationElement = document?.querySelectorAll('.text-body-medium')
      let designation = designationElement[0]?.textContent || null

      event.source!.postMessage({ type: "SET_NAME", name: name?.trimStart().trimEnd() }, { targetOrigin: event.origin });
      event.source!.postMessage({ type: "SET_DESIGNATION", designation: designation?.trimStart().trimEnd() }, { targetOrigin: event.origin });
    }
    
    if(event.data.type === "GET_LINKEDIN_CONTACT_INFO") {
      
    }

    if (event.data.type === "SHOW_PANEL") {
      container.style.display = "block";
      event.source!.postMessage({ type: "INIT" }, { targetOrigin: event.origin });
    }

    if (event.data.type === "HIDE_PANEL") {
      container.style.display = "none";
    }

    if (event.data.type === "URL_CHANGED") {
      event.source!.postMessage({ type: "SET_PAGE", isOnProfilePage: event.data.isOnProfilePage }, { targetOrigin: event.origin });
    }
    
    if(event.data.type === "SET_LINKEDIN_EXPERIENCE_RESULT") {
        console.log("SET_LINKEDIN_EXPERIENCE_RESULT..", event);
        const iframe = document.querySelector<HTMLIFrameElement>("#draggable-container iframe");

        if (!iframe?.contentWindow) return;
        iframe.contentWindow.postMessage(
            {
                type: "SET_EXPERIENCES",
                experience: event.data.data,
            },
            "*",
        );
        event.source!.postMessage({ type: "SET_EXPERIENCES", experience: event.data.data }, { targetOrigin: event.origin });
    }
    
    if(event.data.type === "SET_LINKEDIN_EDUCATION_RESULT") {
        const iframe = document.querySelector<HTMLIFrameElement>("#draggable-container iframe");
        if (!iframe?.contentWindow) return;
        iframe.contentWindow.postMessage(
            {
                type: "SET_EDUCATION",
                education: event.data.data,
            },
            "*",
        );
        event.source!.postMessage({ type: "SET_EDUCATION", education: event.data.data }, { targetOrigin: event.origin });
    }
    

  });
  
  window.addEventListener("popstate", () => {
    onUrlChange(window.location.href);
  });

  const minimizeButton = document.getElementById("minimize-btn");
  minimizeButton?.addEventListener("click", () => {
    const isMinimized = container.classList.toggle("minimized");
    container.style.display = "none"
    isIframeVisible = false;
    chrome.storage.local.set({showPanel: false});
  });

  if(window.location.href.includes("hive.hrnetgroup.com") || window.location.href.includes("localhost")) {
    const token = localStorage.getItem('accessToken');
    if(token) {
      chrome.storage.local.set({hiveAccessToken: token});
    }
  }

  console.info("Draggable, minimizable iframe injected!");
}

function onReady(callback: () => void) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', () => callback(), { once: true });
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SHOW_PANEL") {
    window.postMessage({ type: "SHOW_PANEL" }, "*");
    isIframeVisible = true;
    chrome.storage.local.set({showPanel: true});
  }
  return true;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "HIDE_PANEL") {
    window.postMessage({ type: "HIDE_PANEL" }, "*");
    isIframeVisible = false;
    chrome.storage.local.set({showPanel: false});
  }
  return true; 
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("background message received..", message);
    if (message.type === "LINKEDIN_EXPERIENCE_RESULT") {
        window.postMessage({ type: "SET_LINKEDIN_EXPERIENCE_RESULT", data: message.data }, "*");
    }

    if (message.type === "LINKEDIN_EDUCATION_RESULT") {
        window.postMessage({ type: "SET_LINKEDIN_EDUCATION_RESULT", data: message.data }, "*");
    }
    return false;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHECK_IF_ON_PROFILE_PAGE") {
    const url = new URL(window.location.href);
    const path = url.pathname.replace(/\/+$/, ""); 
    const segments = path.split("/").filter(Boolean); 

    const isOnProfilePage =
      url.hostname === "www.linkedin.com" &&
      segments.length === 2 &&
      segments[0] === "in";
    
    if(isOnProfilePage && !hasOpenedExperienceTab) {
        hasOpenedExperienceTab = true;

        const basePath = segments.slice(0, 3).join("/"); 
        const experiencePage = `${url.origin}/${basePath}/details/experience/`;
        const educationPage = `${url.origin}/${basePath}/details/education/`;

        chrome.runtime.sendMessage({ type: 'SCRAPE_LINKEDIN_EXPERIENCE', url: experiencePage });

        chrome.runtime.sendMessage({ type: 'SCRAPE_LINKEDIN_EXPERIENCE', url: educationPage });
    }
    
    sendResponse({ isOnProfilePage: isOnProfilePage });
  }

  if (message.type === "URL_CHANGED") {
    console.log(" chrome runtime URL_CHANGED..");
    onUrlChange(window.location.href);
  }
  
  return false;
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    injectIframe();
    return;
  });
}

injectIframe();

function getExperienceItems() {
    const items = document.querySelectorAll<HTMLElement>('li.pvs-list__paged-list-item.artdeco-list__item');

    const result:any[] = [];

    items.forEach((li) => {
        const hasGroup = li.querySelector('.pvs-list__container .scaffold-finite-scroll__content') !== null;

        if (hasGroup) {
            // Grouped experience: one company, multiple roles
            const company = li.querySelector<HTMLElement>('.hoverable-link-text.t-bold span[aria-hidden="true"]')?.textContent?.trim() ?? '';

            const roleLis = li.querySelectorAll<HTMLElement>('.pvs-list__container .scaffold-finite-scroll__content li.pvs-list__paged-list-item');

            roleLis.forEach((roleLi) => {
                const title = roleLi.querySelector<HTMLElement>('.hoverable-link-text.t-bold span[aria-hidden="true"]')?.textContent?.trim() ?? '';

                const period = roleLi.querySelector<HTMLElement>('.t-14.t-normal.t-black--light .pvs-entity__caption-wrapper[aria-hidden="true"]')?.textContent?.trim() ?? '';

                if (company || title || period) {
                    result.push({ company, title, period });
                }
            });
        } else {
            // Simple experience: single role
            const title = li.querySelector<HTMLElement>('.hoverable-link-text.t-bold span[aria-hidden="true"]')?.textContent?.trim() ?? '';

            const company = li.querySelector<HTMLElement>('.t-14.t-normal span[aria-hidden="true"]')?.textContent?.trim() ?? '';

            const period = li.querySelector<HTMLElement>('.t-14.t-normal.t-black--light .pvs-entity__caption-wrapper[aria-hidden="true"]')?.textContent?.trim() ?? '';

            if (company || title || period) {
                result.push({ company, title, period });
            }
        }
    });

    return result;
}

function getEducationItems() {
    const items = document.querySelectorAll('li.pvs-list__paged-list-item.artdeco-list__item');

    return Array.from(items).map(li => {
        const school = li.querySelector('.hoverable-link-text.t-bold span[aria-hidden="true"]')?.textContent?.trim() ?? '';

        const degree = li.querySelector('.t-14.t-normal span[aria-hidden="true"]')?.textContent?.trim() ?? '';

        const years = li.querySelector('.t-14.t-normal.t-black--light .pvs-entity__caption-wrapper[aria-hidden="true"]')?.textContent?.trim() ?? '';

        console.log({ school, degree, years });
        
        return { school, degree, years };
    });
}

onReady(() => {
    let experiences: any[] = [];
    if (location.pathname.includes('/details/experience/')) {
        setTimeout(() => {
            console.log('Detected LinkedIn Experience page!', experiences);
            chrome.runtime.sendMessage({type: 'LINKEDIN_EXPERIENCE_RESULT', url: location.href, data: getExperienceItems() });
            hasOpenedExperienceTab = false;
        },3000);
    }

    if (location.pathname.includes('/details/education/')) {
        setTimeout(() => {
            console.log('Detected LinkedIn Education page!');
            chrome.runtime.sendMessage({type: 'LINKEDIN_EDUCATION_RESULT', url: location.href, data: getEducationItems() });
            hasOpenedExperienceTab = false;
        },3000);
    }
    
});