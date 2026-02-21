# Chrome Web Store - Permission Justifications

Copy and paste these **exact justifications** when Chrome Web Store asks about each permission:

---

## 1. **storage** Permission

**Justification:**
```
Required to store authentication tokens for the Hive recruitment system login and maintain user session state across browser restarts. Also stores temporary profile data during the harvesting process before sending to the backend.
```

**Short version (if character limit):**
```
Store authentication tokens for Hive system login and maintain user session across browser restarts.
```

---

## 2. **tabs** Permission

**Justification:**
```
Required to detect when the user navigates to a LinkedIn profile page and to communicate with the content script. Enables the extension to know when to show the harvest UI and to send messages between the extension popup and the LinkedIn page content script.
```

**Short version (if character limit):**
```
Detect LinkedIn profile pages and communicate between extension components and content scripts for data extraction.
```

---

## 3. **background** Permission

**Justification:**
```
Required to run a background service worker that maintains the extension state, handles authentication with the Hive recruitment system, and coordinates communication between the content script (LinkedIn page) and the extension UI (side panel).
```

**Short version (if character limit):**
```
Run service worker to maintain authentication state and coordinate communication between extension components.
```

---

## 4. **sidePanel** Permission

**Justification:**
```
Provides a persistent sidebar UI where recruitment consultants can view extracted LinkedIn profile data, review and edit information, and submit candidate records to the Hive recruitment system. The side panel keeps the form visible while users navigate between multiple LinkedIn profiles.
```

**Short version (if character limit):**
```
Display persistent sidebar where users review extracted profile data and submit to Hive recruitment system.
```

---

## 5. **activeTab** Permission

**Justification:**
```
Required to access and extract profile information from the currently active LinkedIn profile page when the user clicks the "Harvest" button. This permission allows reading visible profile data (name, experience, education, contact info) from the LinkedIn page DOM.
```

**Short version (if character limit):**
```
Access LinkedIn profile page content to extract visible profile data when user clicks "Harvest" button.
```

---

## 6. **Host Permissions** (`<all_urls>` or specific hosts)

### If asked about `<all_urls>`:

**Justification:**
```
Required for three specific purposes:
1. Inject extension UI into LinkedIn pages (www.linkedin.com, linkedin.com)
2. Communicate with internal Hive recruitment system API (hive.hrnetgroup.com, dev.hive.hrnetgroup.com)
3. Access local development environment for testing (localhost:5050)

The extension only actively uses these specific domains and does not access other websites.
```

### If manifest uses specific host patterns:

**For `https://www.linkedin.com/*` and `https://linkedin.com/*`:**
```
Required to inject the extension content script and UI into LinkedIn profile pages, enabling the extraction of publicly visible profile information when the user clicks "Harvest".
```

**For `https://hive.hrnetgroup.com/*` and `https://dev.hive.hrnetgroup.com/*`:**
```
Required to communicate with our internal Hive recruitment system API to authenticate users and submit extracted candidate profile data to our recruitment database.
```

**For `http://localhost:5050/*` (if present):**
```
Required for local development and testing of the extension with a local Hive API instance. This can be removed for production builds if desired.
```

---

## 📋 Summary Table (Quick Reference)

| Permission | Core Reason |
|------------|-------------|
| **storage** | Store auth tokens & session state |
| **tabs** | Detect LinkedIn pages & communicate |
| **background** | Service worker for auth & coordination |
| **sidePanel** | Sidebar UI for data review & submission |
| **activeTab** | Extract data from current LinkedIn page |
| **Host Permissions** | LinkedIn access + Hive API communication |

---

## 🎯 Tips for Chrome Web Store Review

1. **Be Specific:** Mention "Hive recruitment system" and "LinkedIn profile data"
2. **Explain User Action:** Emphasize "when user clicks Harvest button" (not automatic)
3. **Internal Tool:** Mention it's for "authorized recruitment consultants" and "internal use"
4. **Minimal Scope:** Show you only access specific domains (LinkedIn + your API)
5. **Security:** Mention "authentication required" and "secure API communication"

---

## 🚨 Common Review Questions & Answers

### Q: "Why do you need access to all websites?"
**A:** 
```
We do not access all websites. The extension only interacts with:
1. LinkedIn.com (to extract profile data)
2. Our internal Hive API (hive.hrnetgroup.com)
3. Localhost (for development/testing)

The <all_urls> permission is used only to enable the extension to inject its UI on LinkedIn and communicate with our API. We can provide a more specific host_permissions list if required.
```

### Q: "Why do you need the tabs permission?"
**A:**
```
The tabs permission is essential for detecting when a user navigates to a LinkedIn profile page, so we can activate the "Harvest" button in the side panel. It does NOT allow us to access tab content without user action (that's what activeTab is for).
```

### Q: "Can you reduce permissions?"
**A:**
```
All requested permissions are essential for core functionality:
- storage: User authentication (can't remove)
- tabs: Detect LinkedIn pages (can't remove)
- activeTab: Extract profile data when user clicks Harvest (can't remove)
- sidePanel: Display UI (could use popup instead, but less user-friendly)
- background: Coordinate extension components (can't remove in Manifest V3)

We use the minimum permissions required for our recruitment workflow.
```

---

## 📝 Recommended: Update manifest.json Host Permissions

If Chrome reviewers are concerned about `<all_urls>`, consider updating your `manifest.config.ts` to be more specific:

**Replace:**
```typescript
host_permissions: ["<all_urls>"],
```

**With:**
```typescript
host_permissions: [
  "https://www.linkedin.com/*",
  "https://linkedin.com/*",
  "https://hive.hrnetgroup.com/*",
  "https://dev.hive.hrnetgroup.com/*",
  "http://localhost:5050/*"
],
```

This shows Chrome reviewers you only need access to specific, legitimate domains.

---

## ✅ Final Checklist

Before submitting, make sure:
- [ ] All justifications are under 500 characters (Chrome limit per field)
- [ ] You mention "user action" (clicking Harvest button, not automatic)
- [ ] You emphasize "internal tool" and "authentication required"
- [ ] You explain each permission relates to core functionality
- [ ] You're prepared to answer follow-up questions if flagged

---

**Ready to submit!** 🚀

If Chrome reviewers have concerns, you can:
1. Offer to provide test credentials (demo account)
2. Clarify it's an internal tool (not public-facing)
3. Show it requires Hive system login (unauthorized users can't use it)
4. Point to your privacy policy and documentation
