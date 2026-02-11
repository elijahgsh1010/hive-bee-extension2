# Chrome Web Store Listing - Hive LinkedIn Profile Harvester

## Extension Name
```
Hive - LinkedIn Profile Harvester (Internal Tool)
```

## Short Description (132 chars max)
```
Internal recruitment tool: Extract LinkedIn profiles to Hive recruitment system. For authorized consultants only. Login required.
```

## Detailed Description
```
**Hive - LinkedIn Profile Harvester**
**Internal Recruitment Tool for Authorized Consultants**

Hive is a proprietary Chrome extension designed for recruitment consultants within our organization. It streamlines candidate sourcing by extracting LinkedIn profile data and automatically creating candidate records in our internal Hive recruitment system.

**🏢 Who This Is For:**
This extension is for INTERNAL USE ONLY by authorized recruitment consultants at our organization. Users must have valid credentials to access our Hive recruitment system.

**✨ Key Features:**
✅ **One-Click Profile Extraction** - Harvest full LinkedIn profiles in seconds
✅ **Automatic Candidate Creation** - Instantly create candidate records in Hive
✅ **Contact Info Auto-Detection** - Automatically extracts phone and email from the contact info dialog
✅ **Comprehensive Data Capture:**
   - Full name, headline, location
   - Profile photo
   - Current position & company
   - Full work experience with dates, roles, and descriptions
   - Education history (schools, degrees, dates)
   - Contact information (phone, email)

✅ **Smart Parsing** - Works on both profile page and experience details page
✅ **Stable Selectors** - Uses aria-labels and data attributes for reliability
✅ **Data Review & Edit** - Review and modify data before sending to Hive
✅ **Secure Transmission** - All data encrypted via HTTPS to our internal system

**🔐 Security & Privacy:**
- Authentication Required: Must log in to Hive recruitment system
- Secure Storage: All data stored in our internal recruitment database
- Access Controls: Role-based permissions for authorized consultants only
- Compliance: Follows GDPR, CCPA, PDPA and other data protection regulations
- No Third Parties: Data is not shared with external services

**📋 Recruitment Workflow:**
Once a candidate profile is sent to Hive, consultants can:
- Evaluate and screen candidates
- Schedule and coordinate interviews
- Send emails and maintain communication
- Match candidates with job opportunities
- Track recruitment pipeline and history

**⚠️ Important Notes:**
- This extension requires a LinkedIn account
- Users must have valid Hive recruitment system credentials
- For internal organizational use only
- Not intended for public distribution
- Respects LinkedIn's rate limits and terms of service
- Use responsibly: Max 8 profiles/hour, 35/day recommended

**🔗 Privacy Policy:**
https://elijahgsh1010.github.io/hive-bee-extension2/privacy-policy.html

**📧 Support:**
For access requests, technical issues, or questions:
- IT Support: [your-support-email]
- HR Department: hr@hrnetgroup.com

---

**Legal Notice:** This extension is provided for internal recruitment purposes only. Authorized users are responsible for compliance with LinkedIn's Terms of Service and applicable data protection laws. Misuse may result in access revocation and disciplinary action.
```

## Category
```
Productivity
```

## Language
```
English
```

## Website (Optional)
```
https://github.com/elijahgsh1010/hive-bee-extension2
```

## Privacy Policy URL (REQUIRED)
```
https://elijahgsh1010.github.io/hive-bee-extension2/privacy-policy.html
```

## Permissions Justification

When Chrome Web Store review asks about permissions, use these explanations:

### `storage`
**Justification:** Required to store authentication tokens for Hive system login and maintain user session across browser restarts.

### `tabs`
**Justification:** Required to detect when user navigates to a LinkedIn profile page and to send messages to the content script for data extraction.

### `activeTab`
**Justification:** Required to access the currently active LinkedIn profile page content for data extraction when user clicks "Harvest" button.

### `sidePanel`
**Justification:** Provides a persistent UI sidebar where consultants can review and edit extracted profile data before sending to Hive system.

### `<all_urls>`
**Justification:** Required to inject the extension UI into LinkedIn pages and communicate with our internal Hive recruitment system API (dev.hive.hrnetgroup.com, hive.hrnetgroup.com).

## Screenshots Descriptions

### Screenshot 1: Main Interface with Harvested Data
```
Extension sidebar showing extracted LinkedIn profile data including name, contact info, work experience, education, and profile photo. Ready to send to Hive recruitment system.
```

### Screenshot 2: Loading State
```
Animated loading screen while searching for LinkedIn profile. Shows the Hive bee animation.
```

### Screenshot 3: Success State
```
Confirmation screen after successfully creating a candidate record in Hive, with options to navigate to the candidate profile or continue harvesting.
```

## Distribution Settings

**Visibility:** 
- **Unlisted** (Recommended for internal tools)
  - Share installation link only with authorized consultants
  - Not searchable in Chrome Web Store
  - Only accessible via direct link

**OR**

**Visibility:**
- **Private** (Most secure for internal tools)
  - Requires Google Workspace organization
  - Only installable by users in your organization's domain
  - Most appropriate for internal recruitment tool

**Target Audience:**
- Business professionals
- Recruitment industry
- Internal organizational use

**Age Rating:**
- Everyone (professional tool, no inappropriate content)

## Support Email
```
hr@hrnetgroup.com
```

## Single Purpose Description (Required by Chrome Web Store)
```
This extension's single purpose is to extract publicly visible LinkedIn profile information and send it to our internal Hive recruitment system for candidate management by authorized recruitment consultants.
```

## Notes for Chrome Web Store Review

**Important Context for Reviewers:**

1. **Internal Tool:** This extension is designed for internal use by our organization's recruitment consultants. While the source code is public on GitHub, the extension requires authentication with our proprietary Hive recruitment system to function.

2. **Authentication Required:** The extension cannot be used without valid credentials to our internal Hive system. Unauthorized users cannot send or store any data.

3. **Data Destination:** All harvested data goes to our internal recruitment database (hive.hrnetgroup.com), not to any third-party services.

4. **LinkedIn Compliance:** We instruct users to respect LinkedIn's rate limits (max 8 profiles/hour, 35/day) and Terms of Service. This is documented in our privacy policy and internal training materials.

5. **Permissions Usage:** All requested permissions are necessary for core functionality:
   - Content scripts on LinkedIn to extract profile data
   - Storage for authentication tokens
   - Tabs/activeTab for detecting LinkedIn profiles
   - Host permissions for communicating with our internal Hive API

6. **Privacy Policy:** Comprehensive privacy policy hosted at GitHub Pages clearly explains data collection, usage, storage, and candidate rights under GDPR/CCPA/PDPA.

## Testing Instructions for Reviewers

**Note:** Reviewers will not be able to test full functionality without Hive system credentials. 

**What reviewers CAN verify:**
- Extension loads without errors
- UI displays correctly on LinkedIn profiles
- "Harvest" button appears when on LinkedIn profile page
- Extension requests login when not authenticated
- No data is transmitted without user explicitly clicking "Send to Hive"
- User can review and edit all data before sending
- User can clear data at any time

**What reviewers CANNOT test:**
- Actual data transmission to Hive system (requires valid credentials)
- Candidate record creation (requires authenticated Hive account)

If reviewers require test credentials, contact hr@hrnetgroup.com.
