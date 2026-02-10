# Privacy Policy for Hive - LinkedIn Profile Harvester

**Last Updated:** February 10, 2026

## 1. Introduction

Hive ("we", "our", or "the Extension") is a Chrome browser extension designed to help recruiters, researchers, and business professionals extract publicly available LinkedIn profile information for legitimate business purposes.

This Privacy Policy explains how Hive handles data when you use the extension.

## 2. Data We Collect

### 2.1 LinkedIn Profile Data
When you click the "Harvest" button, Hive extracts the following information from the LinkedIn profile currently displayed in your browser:

- **Personal Information:** Full name, headline, location
- **Professional Information:** Current position, company, work experience (titles, companies, dates, descriptions)
- **Education:** Schools attended, degrees obtained, years of study
- **Contact Information:** Email address and phone number (when available in the LinkedIn contact info section)
- **Profile Photo:** Profile picture URL and image data
- **Profile URL:** The LinkedIn profile URL you're currently viewing

### 2.2 Technical Data
- **API Endpoint Configuration:** The backend URL you configure for sending harvested data
- **Authentication Tokens:** Access tokens for your configured backend API (stored locally in your browser)

## 3. How We Use Your Data

### 3.1 Local Processing Only
All data extraction happens **entirely within your browser**. Hive:
- ✅ Extracts data from the LinkedIn page you're viewing
- ✅ Displays it in the extension interface for your review
- ✅ Sends data **only** to your configured backend API endpoint when you click "Send to Hive"

### 3.2 No Cloud Storage
We **do not**:
- ❌ Store any harvested data on our servers
- ❌ Transmit data to any third-party services (except your configured backend)
- ❌ Process or analyze your data in any way
- ❌ Have access to your LinkedIn credentials or session

### 3.3 Your Backend API
When you click "Send to Hive", the harvested data is sent via HTTPS POST request to:
```
YOUR_CONFIGURED_API_ENDPOINT/api/candidateApp/create-candidate-from-linkedin
```

**You control:**
- Where this data is sent (you configure the API endpoint)
- How it's stored (on your own backend/database)
- Who has access to it (your backend permissions)
- How long it's retained (your data retention policy)

## 4. Data Storage

### 4.1 Browser Local Storage
Hive stores the following **locally in your browser only**:
- **Access Token:** For authenticating with your backend API
- **API Endpoint URL:** The base URL of your backend

This data is stored using Chrome's `chrome.storage.local` API and never leaves your device unless you explicitly uninstall the extension or clear browser data.

### 4.2 No Remote Storage
Hive does **not** maintain any databases, servers, or cloud storage infrastructure. All harvested data goes directly from your browser to your configured backend.

## 5. Data Sharing and Third Parties

### 5.1 LinkedIn
Hive accesses publicly available LinkedIn profile information displayed in your browser. We do not:
- Use LinkedIn's official API
- Transmit any data to LinkedIn
- Modify or interact with LinkedIn's services beyond reading displayed content

### 5.2 Your Backend API
When you click "Send to Hive", data is transmitted to **your configured backend only**. You are responsible for:
- The security of your backend API
- Compliance with data protection laws (GDPR, CCPA, etc.)
- How your backend stores and uses the harvested data

### 5.3 No Other Third Parties
Hive does not share data with:
- Analytics services
- Advertising networks
- Data brokers
- Any other third parties

## 6. Data Security

### 6.1 In-Browser Security
- All data extraction happens in your browser's isolated extension context
- Data is transmitted to your backend via **HTTPS only** (if your backend uses HTTPS)
- Authentication tokens are stored securely using Chrome's storage API

### 6.2 Your Responsibility
Since you control the backend API, **you are responsible for**:
- Securing your API endpoint (HTTPS, authentication, authorization)
- Protecting harvested data in your database
- Compliance with data protection regulations
- Access controls and user permissions

## 7. User Rights and Controls

### 7.1 Data Review Before Sending
- You can **review all harvested data** in the extension UI before sending it
- You can **edit** any fields (name, email, phone, experience, education)
- You can **choose not to send** data by closing the extension without clicking "Send to Hive"

### 7.2 Clear Data
- Click the **"Clear"** button to remove all data from the extension form
- Uninstall the extension to remove all locally stored settings and tokens

### 7.3 Access and Deletion
To request deletion of data sent to your backend:
- Contact your organization's backend administrator (you control this data)
- Hive itself has no access to this data and cannot delete it

## 8. Compliance with LinkedIn Terms of Service

### 8.1 Responsible Use
By using Hive, you agree to:
- Respect LinkedIn's Terms of Service
- Only extract data from profiles you have legitimate access to
- Use harvested data for lawful purposes only (recruitment, research, business development)
- Comply with applicable data protection laws (GDPR, CCPA, etc.)

### 8.2 Rate Limiting
LinkedIn may impose rate limits or restrict accounts that excessively scrape profiles. We recommend:
- Using Hive responsibly (avoid bulk scraping)
- Respecting LinkedIn's robots.txt and terms
- Implementing appropriate delays between harvests

## 9. International Data Transfers

If your backend API is hosted in a different country than where you're using the extension:
- Data will be transferred internationally when you click "Send to Hive"
- You are responsible for ensuring compliance with cross-border data transfer regulations (e.g., GDPR Chapter V)

## 10. Children's Privacy

Hive is not intended for use by individuals under 18 years of age. We do not knowingly collect data from children.

## 11. Changes to This Policy

We may update this Privacy Policy from time to time. Changes will be indicated by:
- Updating the "Last Updated" date at the top of this document
- Notifying users via extension update notes (if significant changes occur)

Continued use of Hive after changes constitutes acceptance of the updated policy.

## 12. Contact Information

For questions, concerns, or requests regarding this Privacy Policy:

**Developer Contact:**
- Email: [your-email@domain.com]
- GitHub: [https://github.com/your-org/hive-bee-extension2]

For data-related requests (access, deletion, modification):
- Contact your organization's backend administrator (Hive does not store your data)

## 13. Legal Disclaimer

Hive is provided "as is" without warranties. You are solely responsible for:
- Compliance with LinkedIn's Terms of Service
- Compliance with applicable data protection laws (GDPR, CCPA, etc.)
- The security and use of data sent to your backend
- Any consequences of using Hive for unauthorized or unlawful purposes

## 14. Your Consent

By installing and using Hive, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.

---

**Summary:**
- ✅ All data processing happens in your browser
- ✅ No cloud storage or third-party services
- ✅ Data sent only to YOUR configured backend
- ✅ You control where data goes and how it's stored
- ✅ We have zero access to your harvested data
