import "./index.scss";
import { name } from "~/package.json";
import {json} from "node:stream/consumers";
import { useBrowserLocalStorage } from "../composables/useBrowserStorage"

let isIframeVisible = false;
var hasOpenedExperienceTab = false;
let currentPage = window.location.href;
let hasOpenedHiveTab = false;
const loginUrl = import.meta.env.VITE_BASE_URL;

function checkIfOnProfilePage() {
    const url = new URL(window.location.href);
    const path = url.pathname.replace(/\/+$/, "");
    const segments = path.split("/").filter(Boolean);

    const isOnProfilePage =
        url.hostname === "www.linkedin.com" &&
        segments.length === 2 &&
        segments[0] === "in";
    
    return isOnProfilePage;
}

function getExperienceUrl() {
    const url = new URL(window.location.href);
    const path = url.pathname.replace(/\/+$/, "");
    const segments = path.split("/").filter(Boolean);
    const basePath = segments.slice(0, 3).join("/");
    return `${url.origin}/${basePath}/details/experience/`;
}

function getEducationUrl() {
    const url = new URL(window.location.href);
    const path = url.pathname.replace(/\/+$/, "");
    const segments = path.split("/").filter(Boolean);
    const basePath = segments.slice(0, 3).join("/");
    return `${url.origin}/${basePath}/details/education/`;
}

function getContactUrl() {
    const url = new URL(window.location.href);
    const base = url.href.replace(/\/+$/, "");
    return `${base}/overlay/contact-info/`;
}

function postMessageToIframe(type: string, data: any = {}) {
    const iframe = document.querySelector<HTMLIFrameElement>("#draggable-container iframe");
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
        {
            type: type,
            data: data,
        },
        "*",
    );
}

function onUrlChange(newUrl: string) {
  console.log("onUrlChange", newUrl);
  
  const isOnProfilePage = checkIfOnProfilePage();

  window.postMessage({ type: "URL_CHANGED", data: isOnProfilePage }, "*");
}

function injectIframe() {
    
  const src = chrome.runtime.getURL("src/ui/content-script-iframe/index.html");

  const container = document.createElement("div");
  container.setAttribute("id", "draggable-container");
  container.className = "draggable-container";
  container.style.top = "20px";
  container.style.right = "20px";
  container.style.left = "auto";
    
  chrome.storage.local.get('showPanel', function (result) {
    if(!result.showPanel){
      container.style.display = "none"
    }
  });   

  const header = document.createElement("div");
  header.className = "iframe-header";
  header.innerHTML = `
    <span></span>
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
    
    if (event.data.type === "SHOW_PANEL") {
      container.style.display = "block";
      event.source!.postMessage({ type: "INIT" }, { targetOrigin: event.origin });
    }

    if (event.data.type === "HIDE_PANEL") {
      container.style.display = "none";
    }

    if (event.data.type === "URL_CHANGED") {
      postMessageToIframe("SET_PAGE", event.data.data);
    }
    
    if(event.data.type === "SET_LINKEDIN_EXPERIENCE_RESULT") {
      console.log("SET_LINKEDIN_EXPERIENCE_RESULT..", event);
      postMessageToIframe("SET_EXPERIENCES", event.data.data);
    }
    
    if(event.data.type === "SET_LINKEDIN_EDUCATION_RESULT") {
      postMessageToIframe("SET_EDUCATION", event.data.data);
    }

    if(event.data.type === "SET_LINKEDIN_PROFILE_RESULT") {
      postMessageToIframe("SET_NAME", event.data.data);
    }

    if(event.data.type === "SET_LINKEDIN_CONTACT_RESULT") {
      postMessageToIframe("SET_CONTACT", event.data.data);
    }

    if(event.data.type === "LOGGED_IN") {
      postMessageToIframe("SET_LOGIN");
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
    if (message.type === "LINKEDIN_EXPERIENCE_RESULT") {
        window.postMessage({ type: "SET_LINKEDIN_EXPERIENCE_RESULT", data: message.data }, "*");
    }

    if (message.type === "LINKEDIN_EDUCATION_RESULT") {
        window.postMessage({ type: "SET_LINKEDIN_EDUCATION_RESULT", data: message.data }, "*");
    }

    if (message.type === "LINKEDIN_PROFILE_RESULT") {
        window.postMessage({ type: "SET_LINKEDIN_PROFILE_RESULT", data: message.data }, "*");
    }

    if (message.type === "LINKEDIN_CONTACT_RESULT") {
        window.postMessage({ type: "SET_LINKEDIN_CONTACT_RESULT", data: message.data }, "*");
    }

    if (message.type === "LOGGED_IN") {
        console.log("chrome.runtime.onMessage.addListener", message);
        window.postMessage({ type: "LOGGED_IN", data: message.data }, "*");
    }

    return false;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("background message received..", message);
  if (message.type === "CHECK_IF_ON_PROFILE_PAGE") {
    
    let isProfilePage = checkIfOnProfilePage()
    if(isProfilePage && !hasOpenedExperienceTab) {
        hasOpenedExperienceTab = true;
        const experienceUrl= getExperienceUrl();
        const educationUrl = getEducationUrl();
        const contactInfoUrl = getContactUrl();

        // chrome.runtime.sendMessage({ type: 'SCRAPE_LINKEDIN_EXPERIENCE', url: experienceUrl });
        // chrome.runtime.sendMessage({ type: 'SCRAPE_LINKEDIN_EXPERIENCE', url: educationUrl });
        // chrome.runtime.sendMessage({ type: 'SCRAPE_LINKEDIN_EXPERIENCE', url: window.location.href });
        chrome.runtime.sendMessage({ type: 'SCRAPE_LINKEDIN_EXPERIENCE', url: contactInfoUrl });
    }
    
    sendResponse({ isOnProfilePage: isProfilePage });
  }

  if (message.type === "LOGIN") {
    if(!hasOpenedHiveTab) {
      hasOpenedHiveTab = true;
      chrome.runtime.sendMessage({ type: 'LOGIN_TO_HIVE', url: loginUrl });
    }
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

function getContactInfo(root: ParentNode = document) {
    let phone: string | null = null;
    let email: string | null = null;

    // All "contact type" sections (Profile, Phone, Email, Birthday, Connected, ...)
    const sections = root.querySelectorAll<HTMLElement>("section.pv-contact-info__contact-type");

    sections.forEach(section => {
        const headingText = section
            .querySelector<HTMLElement>(".pv-contact-info__header")
            ?.textContent
            ?.trim() || "";

        if (/phone/i.test(headingText)) {
            // First dark phone span
            const phoneSpan = section.querySelector<HTMLElement>(
                "ul.list-style-none li span.t-14.t-black.t-normal"
            );
            phone = phoneSpan?.textContent?.trim() || null;
        }

        if (/email/i.test(headingText)) {
            const emailLink = section.querySelector<HTMLAnchorElement>("a[href^='mailto:']");
            const href = emailLink?.getAttribute("href") || "";
            // Strip "mailto:" if present
            email = href.replace(/^mailto:/i, "").trim() || null;
        }
    });

    console.log('get linkedin contact info', { phone, email });
    return { phone, email };
}

onReady(() => {
    if (location.pathname.includes('/details/experience/')) {
        setTimeout(() => {
            chrome.runtime.sendMessage({type: 'LINKEDIN_EXPERIENCE_RESULT', url: location.href, data: getExperienceItems() });
            hasOpenedExperienceTab = false;
        },2000);
    }

    if (location.pathname.includes('/details/education/')) {
        setTimeout(() => {
            chrome.runtime.sendMessage({type: 'LINKEDIN_EDUCATION_RESULT', url: location.href, data: getEducationItems() });
            hasOpenedExperienceTab = false;
        },2000);
    }

    if(location.pathname.includes('/overlay/contact-info/')) {
        setTimeout(() => {
            chrome.runtime.sendMessage({type: 'LINKEDIN_CONTACT_RESULT', url: location.href, data: getContactInfo() });
            hasOpenedExperienceTab = false;
        },2000);
    }
    
    if(checkIfOnProfilePage()) {
        setTimeout(() => {
            const nameLink = document.querySelector<HTMLAnchorElement>('a[href*="/overlay/about-this-profile/"]');
            const name = nameLink?.getAttribute("aria-label") ?? "";
            const designationElement = document?.querySelectorAll('.text-body-medium')
            let designation = designationElement[0]?.textContent || ""

            chrome.runtime.sendMessage({type: 'LINKEDIN_PROFILE_RESULT', url: location.href, data: { name: name?.trimStart().trimEnd(), designation: designation.trimStart().trimEnd() } });
            hasOpenedExperienceTab = false;
        }, 2000);
    }

    if(window.location.href.includes("hive.hrnetgroup.com") || window.location.href.includes("localhost")) {
      const token = localStorage.getItem('accessToken');
      if(token) {
        chrome.storage.local.set({hiveAccessToken: token});
        chrome.runtime.sendMessage({type: 'LOGGED_IN', url: loginUrl } );
      }
      hasOpenedHiveTab = false;
    }
    
});
