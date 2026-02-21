import "./index.scss";
import { name } from "~/package.json";
import {json} from "node:stream/consumers";
import { useBrowserLocalStorage } from "../composables/useBrowserStorage"

let isIframeVisible = false;
let hasOpenedExperienceTab = false;
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
  if(!window.location.href.includes("linkedin.com")) {
      return;
  }
    
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
    <button id="minimize-btn">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
      <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
    </svg>
  </button>
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
  if (message.type === "CHECK_IF_ON_PROFILE_PAGE") {
    let iframeContainer = document.getElementById("draggable-container");
    if (iframeContainer?.style.display === "none") return;
    
    let isProfilePage = checkIfOnProfilePage()
    if(isProfilePage && !hasOpenedExperienceTab) {
    
    }
    
    sendResponse({ isOnProfilePage: isProfilePage });
  }

  if (message.type === "HARVEST") {
    let isProfilePage = checkIfOnProfilePage()
    if(isProfilePage) {
      let experience = getExperience();
      let education = getEducation2();
      let name = getNameAndDesignation();
      postMessageToIframe("SET_NAME", name);
      postMessageToIframe("SET_EXPERIENCES", experience);
      postMessageToIframe("SET_EDUCATION", education);
      return;
    }
    
    if(window.location.href.includes("/details/experience/") ) {
      let experience = getExperience();
      postMessageToIframe("SET_EXPERIENCES", experience);
      return;
    }

    if(window.location.href.includes("/details/education/") ) {
      let education = getEducation2();
      postMessageToIframe("SET_EDUCATION", education);
      return;
    }
    
  }

  if (message.type === "LOGIN") {
    chrome.runtime.sendMessage({ type: 'LOGIN_TO_HIVE', url: loginUrl });
  }
    
  return false;
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    injectIframe();
    startContactInfoDetection();
    return;
  });
}

injectIframe();
startContactInfoDetection();

// Track if we've already extracted contact info for the current dialog
let lastExtractedContactDialog: Element | null = null;

/**
 * Detects if a Contact Info dialog is open and extracts phone/email
 */
function detectAndExtractContactInfo() {
    // Find the contact info dialog
    const dialog = document.querySelector('dialog[data-testid="dialog"][open]');
    if (!dialog) {
        lastExtractedContactDialog = null;
        return;
    }
    
    // Check if this is the Contact Info dialog by looking for the header
    const header = dialog.querySelector('h2');
    if (!header || !header.textContent?.includes('Contact info')) {
        return;
    }
    
    // Skip if we already extracted from this dialog instance
    if (lastExtractedContactDialog === dialog) {
        return;
    }
    
    console.log('[HiveBee] Contact Info dialog detected, extracting...');
    
    let phone = '';
    let email = '';
    
    // Extract Phone - look for phone-handset-small SVG
    const phoneSvg = dialog.querySelector('svg#phone-handset-small');
    if (phoneSvg) {
        // Get the parent container and find the phone number
        const phoneContainer = phoneSvg.closest('div[componentkey]') || phoneSvg.parentElement?.parentElement;
        if (phoneContainer) {
            // Look for the span with the phone number (first span in the second <p>)
            const paragraphs = phoneContainer.querySelectorAll('p');
            for (const p of paragraphs) {
                // Skip the "Phone" label
                if (p.textContent?.trim() === 'Phone') continue;
                
                // Get the phone number from the span or the paragraph text
                const phoneSpan = p.querySelector('span');
                if (phoneSpan) {
                    const phoneText = phoneSpan.textContent?.trim() || '';
                    if (phoneText && /[\d\s\-\+\(\)]+/.test(phoneText)) {
                        phone = phoneText;
                        break;
                    }
                }
            }
        }
    }
    
    // Extract Email - look for envelope-medium SVG or mailto: link
    const emailSvg = dialog.querySelector('svg#envelope-medium');
    if (emailSvg) {
        const emailContainer = emailSvg.closest('div[componentkey]') || emailSvg.parentElement?.parentElement;
        if (emailContainer) {
            // Look for mailto: link
            const mailtoLink = emailContainer.querySelector('a[href^="mailto:"]');
            if (mailtoLink) {
                email = mailtoLink.textContent?.trim() || '';
                // Fallback to href if text is empty
                if (!email) {
                    const href = mailtoLink.getAttribute('href') || '';
                    email = href.replace('mailto:', '');
                }
            }
        }
    }
    
    // Fallback: search for mailto: link anywhere in dialog
    if (!email) {
        const mailtoLink = dialog.querySelector('a[href^="mailto:"]');
        if (mailtoLink) {
            email = mailtoLink.textContent?.trim() || mailtoLink.getAttribute('href')?.replace('mailto:', '') || '';
        }
    }
    
    // Only post if we found at least one piece of contact info
    if (phone || email) {
        console.log('[HiveBee] Extracted contact info:', { phone, email });
        postMessageToIframe("SET_CONTACT", { phone, email });
        lastExtractedContactDialog = dialog;
    }
}

/**
 * Starts the interval to detect contact info dialog
 */
function startContactInfoDetection() {
    // Run every 1 second
    setInterval(() => {
        detectAndExtractContactInfo();
    }, 1000);
    
    console.log('[HiveBee] Contact info detection started (1s interval)');
}

function getContactInfo2() {
    return;
    // Find and click the "Contact info" link
    const contactLink = Array.from(document.querySelectorAll('a')).find(
        (a) => a.textContent?.trim() === 'Contact info'
    );

    if (!contactLink) {
        callback({ email: '', phone: '' });
        return;
    }

    contactLink.click();

    // Wait 2 seconds for dialog to load
    setTimeout(() => {
        let email = '';
        let phone = '';

        // Find all <p> elements and look for "Phone" and "Email" labels
        const allParagraphs = document.querySelectorAll('p');

        allParagraphs.forEach((p) => {
            const text = p.textContent?.trim();

            if (text === 'Phone') {
                // Get the next sibling <p> which contains the phone number
                const nextP = p.parentElement?.querySelector('p:nth-of-type(2)');
                if (nextP) {
                    // Extract just the number (remove "(Mobile)" etc.)
                    const phoneText = nextP.textContent?.trim() ?? '';
                    phone = phoneText.replace(/\s*\(.*\)/, '').trim();
                }
            }

            if (text === 'Email') {
                // Get the next sibling <p> which contains the email link
                const nextP = p.parentElement?.querySelector('p:nth-of-type(2)');
                if (nextP) {
                    email = nextP.textContent?.trim() ?? '';
                }
            }
        });

        postMessageToIframe("SET_CONTACT", { email, phone });
        
        // Close the dialog
        const closeButton = document.querySelector<HTMLButtonElement>(
            'button[aria-label="Dismiss"], button[aria-label="Close"]'
        );
        if (closeButton) {
            closeButton.click();
        } else {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        }
    }, 2000);
}

function getNameAndDesignation() {
    // Find the section with the profile card component
    const profileSection = document.querySelector<HTMLElement>(
        'section[componentkey*="com.linkedin.sdui.profile.card"]'
    );

    if (!profileSection) {
        console.warn('[HiveBee] Profile card section not found');
        return { name: '', designation: '', photoUrl: null };
    }

    // Extract name from the first h2 tag
    const nameElement = profileSection.querySelector<HTMLHeadingElement>('h2');
    const name = nameElement?.textContent?.trim() ?? '';

    // Extract designation from the first paragraph that doesn't contain "·"
    let designation = '';
    const paragraphs = Array.from(profileSection.querySelectorAll('p'));
    
    for (const p of paragraphs) {
        const text = p.textContent?.trim() ?? '';
        // Skip empty, connection count, and separator lines
        if (text && !text.includes('·') && !text.match(/^\d+\s*(connection|st|nd|rd|th)/i)) {
            designation = text;
            break;
        }
    }

    const photoUrl = getProfilePhoto();

    console.log('[HiveBee] Profile extracted:', { name, designation, photoUrl });

    return { name, designation, photoUrl };
}

function extractDescriptionFromLink(link: any): string {
    // Look for description in parent containers
    let container: Element | null = link.parentElement;
    while (container && !container.querySelector('[data-testid="expandable-text-box"]')) {
        container = container.parentElement;
        // Don't go too far up
        if (container && container.getAttribute('componentkey')?.startsWith('entity-collection-item')) {
            break;
        }
    }
    
    const descSpan = container?.querySelector('[data-testid="expandable-text-box"]');
    if (descSpan) {
        const clone = descSpan.cloneNode(true) as HTMLElement;
        const button = clone.querySelector('button');
        if (button) button.remove();
        return clone.textContent?.trim() || "";
    }
    
    return "";
}

function getExperience() {
    // --- 1. Find Experience section (details view OR main view) ---
    let experienceHeader =
        document.querySelector('[data-testid^="profile_ExperienceDetailsSection"] p') ||
        Array.from(document.querySelectorAll("h2, p"))
            .find(el => el.textContent?.trim() === "Experience");

    if (!experienceHeader) return [];

    const experienceSection =
        experienceHeader.closest('[data-component-type="LazyColumn"]') ||
        experienceHeader.closest("section") ||
        experienceHeader.closest("div");

    if (!experienceSection) return [];

    // --- 2. Collect all top-level experience items ---
    const experienceItems = Array.from(
        experienceSection.querySelectorAll('[componentkey^="entity-collection-item"]')
    );

    const results: any[] = [];
    const seen = new Set<string>();

    experienceItems.forEach(item => {
        // Skip separators
        if (item.querySelector('hr[role="presentation"]') && !item.querySelector('a, p')) {
            return;
        }

        // --- 3. Detect nested roles ---
        let rolesList = item.querySelector('ul');
        if (!rolesList && item.nextElementSibling?.tagName === 'UL') {
            rolesList = item.nextElementSibling as HTMLUListElement;
        }

        // --- 4. Extract company name from parent block ---
        const company =
            item.querySelector('a[href*="/company/"] p')?.textContent?.trim() || "";

        // ---------- MULTI-ROLE COMPANY ----------
        if (rolesList) {
            const roles = Array.from(rolesList.querySelectorAll('li'));

            roles.forEach(role => {
                const roleLink = role.querySelector('a[href*="/company/"]');
                if (!roleLink) return;

                const paragraphs = Array.from(roleLink.querySelectorAll('p'));

                const title = paragraphs[0]?.textContent?.trim() || "";
                const period = paragraphs
                    .find(p => /\d+\s*(yr|mo|year|month)/i.test(p.textContent || ""))
                    ?.textContent?.trim() || "";

                const location = paragraphs
                    .find(p => {
                        const t = p.textContent || "";
                        return t.includes(",") && !/\d+\s*(yr|mo)/i.test(t);
                    })
                    ?.textContent?.trim() || "";

                const description =
                    role.querySelector('[data-testid="expandable-text-box"]')
                        ?.textContent?.trim() || "";

                const key = `${company}|${title}|${period}`;
                if (seen.has(key)) return;
                seen.add(key);

                results.push({ company, title, period, location, description });
            });

            return;
        }

        // ---------- SINGLE ROLE ----------
        const contentLink = item.querySelector('a[href*="/company/"]:has(p)');
        if (!contentLink) return;

        const paragraphs = Array.from(contentLink.querySelectorAll('p'));

        const title = paragraphs[0]?.textContent?.trim() || "";
        const companyText = paragraphs[1]?.textContent || "";
        const companyName = companyText.split('·')[0].trim();

        const period = paragraphs
            .find(p => /\d+\s*(yr|mo|year|month)/i.test(p.textContent || ""))
            ?.textContent?.trim() || "";

        const location = paragraphs
            .find(p => {
                const t = p.textContent || "";
                return t.includes(",") && !/\d+\s*(yr|mo)/i.test(t);
            })
            ?.textContent?.trim() || "";

        const description =
            item.querySelector('[data-testid="expandable-text-box"]')
                ?.textContent?.trim() || "";

        const key = `${companyName}|${title}|${period}`;
        if (seen.has(key)) return;
        seen.add(key);

        results.push({
            company: companyName,
            title,
            period,
            location,
            description
        });
    });

    return results;
}


function getProfilePhoto() {
    const photoContainer = document.querySelector('div[aria-label="Profile photo"]');
    if (photoContainer) {
        const img = photoContainer.querySelector('img');
        if (img) {
            const src = img.getAttribute('src');
            if (src && src.includes('media.licdn.com')) {
                return src;
            }
        }
    }

    const loadedImg = document.querySelector('img[data-loaded="true"]');
    if (loadedImg) {
        const src = loadedImg.getAttribute('src');
        if (src && src.includes('profile-displayphoto')) {
            return src;
        }
    }
    
    return null;
}

function getEducation2() {
    // Find the Education section by heading
    const educationHeader = Array.from(document.querySelectorAll("h2"))
        .find(h => h.textContent?.trim() === "Education");
    
    if (!educationHeader) return [];
    
    const educationSection = educationHeader.closest("section");
    if (!educationSection) return [];

    // Get all education items by componentkey
    const educationItems = Array.from(
        educationSection.querySelectorAll<HTMLElement>('[componentkey]')
    ).filter(item => {
        // Filter to only education items (those with school links)
        return item.querySelector('a[href*="/school/"]') !== null;
    });

    const results: { school: string; degree: string; years: string }[] = [];
    const seen = new Set<string>();

    educationItems.forEach((item) => {
        // Find school link
        const schoolLink = item.querySelector<HTMLAnchorElement>('a[href*="/school/"]');
        if (!schoolLink) return;

        // Get all paragraphs in the entire item (handles both structures:
        // 1. Paragraphs inside the <a> tag
        // 2. Paragraphs in sibling <div role="button">)
        const allParagraphs = Array.from(item.querySelectorAll('p'));
        
        let school = '';
        let degree = '';
        let years = '';

        allParagraphs.forEach((p) => {
            const text = p.textContent?.trim() ?? '';
            if (!text) return;

            // Check if it's a year pattern (2013 – 2014 or 2013 - Present)
            if (/^\d{4}\s*[–-]\s*(\d{4}|Present)$/i.test(text)) {
                years = text;
            } else if (!school) {
                // First non-year text is school name
                school = text;
            } else if (!degree) {
                // Second non-year text is degree
                degree = text;
            }
        });

        // Create a unique key to avoid duplicates
        const key = `${school}|${degree}|${years}`;
        if (!key || key === '||' || seen.has(key)) return;
        seen.add(key);

        if (school || degree) {
            results.push({ school, degree, years });
        }
    });

    return results;
}

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
                const descriptionEl = roleLi.querySelector<HTMLElement>(
                    '.pvs-entity__sub-components .t-14.t-normal.t-black span[aria-hidden="true"]'
                );
                const description = descriptionEl?.textContent?.trim() ?? '';

                if (company || title || period) {
                    result.push({ company, title, period, description });
                }
            });
        } else {
            // Simple experience: single role
            const title = li.querySelector<HTMLElement>('.hoverable-link-text.t-bold span[aria-hidden="true"]')?.textContent?.trim() ?? '';

            const company = li.querySelector<HTMLElement>('.t-14.t-normal span[aria-hidden="true"]')?.textContent?.trim() ?? '';

            const period = li.querySelector<HTMLElement>('.t-14.t-normal.t-black--light .pvs-entity__caption-wrapper[aria-hidden="true"]')?.textContent?.trim() ?? '';
            // Extract roles & responsibilities from sub-components
            const descriptionEl = li.querySelector<HTMLElement>(
                '.pvs-entity__sub-components .t-14.t-normal.t-black span[aria-hidden="true"]'
            );
            const description = descriptionEl?.textContent?.trim() ?? '';

            if (company || title || period) {
                result.push({ company, title, period, description });
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
            const phoneSpan = section.querySelector<HTMLElement>(
                "ul.list-style-none li span.t-14.t-black.t-normal"
            );
            phone = phoneSpan?.textContent?.trim() || null;
        }

        if (/email/i.test(headingText)) {
            const emailLink = section.querySelector<HTMLAnchorElement>("a[href^='mailto:']");
            const href = emailLink?.getAttribute("href") || "";
            email = href.replace(/^mailto:/i, "").trim() || null;
        }
    });

    return { phone, email };
}

onReady(() => {
    if(window.location.href.includes("hive.hrnetgroup.com") || window.location.href.includes("localhost")) {
      const token = localStorage.getItem('accessToken');
      if(token) {
        chrome.storage.local.set({hiveAccessToken: token});
        chrome.runtime.sendMessage({type: 'LOGGED_IN', url: loginUrl } );
      }
    }
});
