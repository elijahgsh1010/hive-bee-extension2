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
      // let contactInfo = getContactInfo2();
      // const experienceUrl= getExperienceUrl();
      // const educationUrl = getEducationUrl();
      // const contactInfoUrl = getContactUrl();
      // chrome.runtime.sendMessage({ type: 'SCRAPE_LINKEDIN_EXPERIENCE', url: experienceUrl });
      // chrome.runtime.sendMessage({ type: 'SCRAPE_LINKEDIN_EXPERIENCE', url: educationUrl });
      // chrome.runtime.sendMessage({ type: 'SCRAPE_LINKEDIN_EXPERIENCE', url: window.location.href });
      // chrome.runtime.sendMessage({ type: 'SCRAPE_LINKEDIN_EXPERIENCE', url: contactInfoUrl });
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
    return;
  });
}

injectIframe();

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
    // Find the name container
    const nameContainer = document.querySelector<HTMLElement>(
        '[data-view-name="profile-top-card-verified-badge"]'
    );

    // Extract name
    const name = nameContainer
        ?.querySelector<HTMLHeadingElement>('h2')
        ?.textContent
        ?.trim() ?? '';

    // Walk forward to find the real designation paragraph
    let designation = '';
    let current = nameContainer?.parentElement?.nextElementSibling ?? null;

    while (current) {
        if (
            current.tagName === 'P' &&
            current.textContent &&
            !current.textContent.includes('·')
        ) {
            designation = current.textContent.trim();
            break;
        }
        current = current.nextElementSibling;
    }

    const photoUrl = getProfilePhoto();

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
    // Look for "Experience" in h2 (main profile page) or p (details page)
    let experienceHeader = Array.from(document.querySelectorAll("h2"))
        .find(h => h.textContent.trim() === "Experience");
    
    if (!experienceHeader) {
        experienceHeader = Array.from(document.querySelectorAll("p"))
            .find(p => p.textContent.trim() === "Experience");
    }

    if (!experienceHeader) return [];

    const experienceSection = experienceHeader.closest("section") || experienceHeader.closest("div");
    if (!experienceSection) return [];

    // Get all experience items
    const experienceItems = Array.from(
        experienceSection.querySelectorAll('div[componentkey^="entity-collection-item"]')
    );

    const seen = new Set();
    const results: any = [];

    experienceItems.forEach(item => {
        // Skip if it's just an HR separator
        if (item.querySelector('hr[role="presentation"]') && !item.querySelector('a, p')) {
            return;
        }

        // Check for nested roles
        // The <ul> can be INSIDE the item OR as the next sibling
        let nestedRolesList = item.querySelector('ul');
        
        // If not inside, check if next sibling is a <ul>
        if (!nestedRolesList && item.nextElementSibling?.tagName === 'UL') {
            nestedRolesList = item.nextElementSibling as HTMLElement;
        }
        
        const nestedRoles = nestedRolesList ? Array.from(nestedRolesList.querySelectorAll('li')) : [];

        if (nestedRoles.length > 0) {
            // Multiple roles at same company
            const companyLinks = item.querySelectorAll('a[href*="/company/"]');
            const companyLink = Array.from(companyLinks).find(link =>
                link.querySelector('p')
            );

            const companyParagraphs = companyLink?.querySelectorAll('p') || [];
            const company = companyParagraphs[0]?.textContent?.trim() || "";

            nestedRoles.forEach(roleItem => {
                const roleLink = roleItem.querySelector('a[href*="/company/"]');
                if (!roleLink) return;

                const allParasInLink = Array.from(roleLink.querySelectorAll('p'));
                const title = allParasInLink[0]?.textContent?.trim() || "";

                // Period matches duration pattern
                const period = allParasInLink.find(p =>
                    /\d+\s*(yr|mo|mos|year|month)/i.test(p.textContent || "")
                )?.textContent?.trim() || "";
                
                // Location (if present in nested role)
                const location = allParasInLink.find(p => {
                    const text = p.textContent?.trim() || "";
                    return text.includes(',') && 
                           !text.includes('·') && 
                           !/\d+\s*(yr|mo)/.test(text);
                })?.textContent?.trim() || "";

                const description = extractDescriptionFromLink(roleLink);

                const key = `${company}|${title}|${period}`;
                if (seen.has(key)) return;
                seen.add(key);

                results.push({ company, title, period, description, location });
            });
        } else {
            // Single role
            // Find the main content anchor (not the logo anchor)
            const allLinks = Array.from(item.querySelectorAll('a[href*="/company/"]'));
            const contentLink = allLinks.find(link => link.querySelector('p'));

            if (!contentLink) {
                // No company link (self-employed, etc.) - extract from paragraphs directly using patterns
                const allParagraphs = Array.from(item.querySelectorAll('p'));

                // Title is typically the first paragraph without '·' or duration pattern
                const title = allParagraphs.find(p =>
                    p.textContent &&
                    !p.textContent.includes('·') &&
                    !/\d+\s*(yr|mo|mos|year|month)/i.test(p.textContent)
                )?.textContent?.trim() || "";

                // Company is in a paragraph with '·' separator
                const companyPara = allParagraphs.find(p =>
                    p.textContent?.includes('·')
                );
                const company = companyPara?.textContent?.split('·')[0]?.trim() || "";

                // Period matches duration pattern
                const period = allParagraphs.find(p =>
                    /\d+\s*(yr|mo|mos|year|month)/i.test(p.textContent || "")
                )?.textContent?.trim() || "";

                // Description from the item itself
                const descSpan = item.querySelector('[data-testid="expandable-text-box"]');
                let description = "";
                if (descSpan) {
                    const clone = descSpan.cloneNode(true) as HTMLElement;
                    const button = clone.querySelector('button');
                    if (button) button.remove();
                    description = clone.textContent?.trim() || "";
                }
                
                const key = `${company}|${title}|${period}`;
                if (!key || seen.has(key)) return;
                seen.add(key);

                results.push({ company, title, period, description });
                return;
            }

            // Has company link
            const allParasInLink = Array.from(contentLink.querySelectorAll('p'));
            
            // First <p> = Title
            const title = allParasInLink[0]?.textContent?.trim() || "";

            // Second <p> = Company · Employment type
            const companyText = allParasInLink[1]?.textContent || "";
            const company = companyText.split('·')[0].trim();

            // Period matches duration pattern (yr/mo)
            const period = allParasInLink.find(p =>
                /\d+\s*(yr|mo|mos|year|month)/i.test(p.textContent || "")
            )?.textContent?.trim() || "";
            
            // Location is a paragraph with comma (City, State/Country) but not duration
            const location = allParasInLink.find(p => {
                const text = p.textContent?.trim() || "";
                return text.includes(',') && 
                       !text.includes('·') && 
                       !/\d+\s*(yr|mo)/.test(text);
            })?.textContent?.trim() || "";

            // Description is in the item container (not in link)
            const description = extractDescriptionFromLink(contentLink);

            const key = `${company}|${title}|${period}`;
            if (!key || seen.has(key)) return;
            seen.add(key);

            results.push({ company, title, period, description, location });
        }
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
