import "./index.scss";
import { name } from "~/package.json";
import {json} from "node:stream/consumers";
import { useBrowserLocalStorage } from "../composables/useBrowserStorage"

let isIframeVisible = false;

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
    <button id="minimize-btn">x</button>
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
    if (event.data.type === "GET_LINKEDIN_NAME") {
      const element = document.querySelectorAll(event.data.selector);
      event.source!.postMessage({ type: "NAME_RESULT", element: element[0]?.firstElementChild.ariaLabel }, { targetOrigin: event.origin });
    }
    
    if(event.data.type === "GET_LINKEDIN_DESIGNATION") {
      const titleElement = document?.querySelectorAll('.text-body-medium')
      var title = titleElement[0]?.textContent || null

      event.source!.postMessage({ type: "DESIGNATION_RESULT", element: title?.trimStart().trimEnd() }, { targetOrigin: event.origin });
    }

    if (event.data.type === "GET_LINKEDIN_EXPERIENCE") {
      const element = document.querySelectorAll(event.data.selector);
      event.source!.postMessage({ type: "EXPERIENCE_RESULT", element: element[2]?.innerText }, { targetOrigin: event.origin });
    }

    if (event.data.type === "GET_LINKEDIN_EDUCATION") {
      const element = document.querySelectorAll(event.data.selector);
      event.source!.postMessage({ type: "EDUCATION_RESULT", element: element[2]?.innerText }, { targetOrigin: event.origin });
    }

    if (event.data.type === "SHOW_PANEL") {
      container.style.display = "block";
    }

    if (event.data.type === "HIDE_PANEL") {
      container.style.display = "none";
    }

    if (event.data.type === "URL_CHANGED") {
      event.source!.postMessage({ type: "SET_PAGE", isOnProfilePage: event.data.isOnProfilePage }, { targetOrigin: event.origin });
    }

  });
  
  window.addEventListener("popstate", () => {
    console.log("popstate..");
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
  if (message.type === "CHECK_IFRAME_STATE") {
    sendResponse?.({ isVisible: isIframeVisible });
  }
  return false;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHECK_IF_ON_PROFILE_PAGE") {
    let isOnProfilePage = document.getElementById('profile-content') !== null;
    sendResponse({ isOnProfilePage: isOnProfilePage });
  }

  if (message.type === "URL_CHANGED") {
    onUrlChange(window.location.href);
  }
  
  return false;
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    injectIframe();
  });
} else {
  injectIframe();
}
