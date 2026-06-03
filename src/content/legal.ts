import { brands } from "@/content/site";

export const legalEntity = brands.nurtureCollective.name;
export const legalBrand = brands.nestingPlace.name;
export const legalContactEmail = brands.nestingPlace.email;
export const legalLastUpdated = "May 31, 2026";

export const legalPaths = {
  privacyPolicy: "/privacy-policy",
  termsOfUse: "/terms",
} as const;

export interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export const privacyPolicySections: LegalSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    paragraphs: [
      `${legalEntity} ("we," "us," or "our") operates ${legalBrand} and related websites, member tools, and applications (collectively, the "Service"). This Privacy Policy explains how we collect, use, disclose, and protect information when you use the Service.`,
      `By using the Service, you agree to this Privacy Policy. If you do not agree, please do not use the Service.`,
    ],
  },
  {
    id: "information-we-collect",
    title: "Information we collect",
    paragraphs: ["We may collect the following categories of information:"],
    bullets: [
      "Account information — name, email address, phone number, and authentication identifiers when you create an account or sign in.",
      "Profile and intake information — details you provide about your pregnancy, postpartum, or care needs, preferences, and communications with our support team.",
      "Payment and billing information — purchase details, order amounts, and transaction references. Card payments are processed by our payment partners; we do not store full payment card numbers on our servers.",
      "Communications — messages you send through contact forms, SMS, email, or in-app chat.",
      "Technical information — device type, browser, IP address, and usage data needed to operate and secure the Service.",
    ],
  },
  {
    id: "how-we-use",
    title: "How we use information",
    paragraphs: ["We use information to:"],
    bullets: [
      "Provide maternal wellness coordination, scheduling, and member services.",
      "Process purchases, gift cards, and billing-related requests.",
      "Connect you with care professionals and internal coordinators.",
      "Send service-related messages, reminders, and responses you request.",
      "Improve the Service, prevent fraud, and comply with legal obligations.",
    ],
  },
  {
    id: "third-parties",
    title: "Third-party services",
    paragraphs: [
      "We use trusted service providers to operate the Service. These may include cloud hosting, identity and authentication, payment processing, accounting and invoicing, messaging, analytics, and automation tools. Providers process data only as needed to perform services on our behalf and under contractual obligations.",
      "When you pay through our website, payment data is handled by our payment processor. When invoices or receipts are recorded in accounting systems, limited billing details may be shared with our accounting integration partners.",
    ],
  },
  {
    id: "health",
    title: "Health and medical information",
    paragraphs: [
      `${legalBrand} provides maternal wellness and support services — not medical diagnosis or treatment. Information you share helps us coordinate care; it is not a substitute for advice from your licensed healthcare provider.`,
      "Unless we have entered into a specific agreement with you, we do not represent that the Service is a HIPAA-covered platform. Please do not use the Service to transmit emergency medical information.",
    ],
  },
  {
    id: "retention",
    title: "Data retention",
    paragraphs: [
      "We retain information for as long as needed to provide the Service, meet legal requirements, resolve disputes, and enforce our agreements. You may request deletion of certain account data subject to applicable law and operational requirements.",
    ],
  },
  {
    id: "security",
    title: "Security",
    paragraphs: [
      "We use administrative, technical, and organizational measures designed to protect information. No method of transmission or storage is completely secure; we cannot guarantee absolute security.",
    ],
  },
  {
    id: "your-rights",
    title: "Your choices and rights",
    paragraphs: [
      "Depending on where you live, you may have rights to access, correct, delete, or restrict certain processing of your personal information. To exercise these rights, contact us using the information below.",
      "You may opt out of marketing emails by using unsubscribe links where provided. Service-related messages may still be sent when necessary to fulfill your request or account.",
    ],
  },
  {
    id: "children",
    title: "Children",
    paragraphs: [
      "The Service is intended for adults and caregivers. We do not knowingly collect personal information from children under 13 without appropriate parental consent.",
    ],
  },
  {
    id: "changes",
    title: "Changes to this policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. We will post the revised policy on this page and update the \"Last updated\" date. Continued use of the Service after changes constitutes acceptance of the updated policy.",
    ],
  },
  {
    id: "contact",
    title: "Contact us",
    paragraphs: [
      `Questions about this Privacy Policy or our data practices may be sent to ${legalContactEmail}.`,
    ],
  },
];

export const termsOfUseSections: LegalSection[] = [
  {
    id: "agreement",
    title: "Agreement to terms",
    paragraphs: [
      `These Terms of Use ("Terms") are a binding agreement between you and ${legalEntity} governing your use of ${legalBrand} websites, applications, and related services (the "Service"). By accessing or using the Service, you agree to these Terms.`,
      "If you do not agree, do not use the Service.",
    ],
  },
  {
    id: "license",
    title: "License to use the Service",
    paragraphs: [
      `Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for personal, non-commercial purposes related to obtaining maternal wellness and support services from ${legalBrand}.`,
      "You may not copy, modify, distribute, sell, reverse engineer, or misuse the Service except as expressly permitted by us in writing.",
    ],
  },
  {
    id: "accounts",
    title: "Accounts and security",
    paragraphs: [
      "You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us promptly of any unauthorized use.",
      "We may suspend or terminate accounts that violate these Terms or pose a security risk.",
    ],
  },
  {
    id: "not-medical",
    title: "Not medical advice",
    paragraphs: [
      `Content and coordination through the Service are for informational and support purposes. ${legalBrand} does not provide medical diagnosis, treatment, or emergency services. Always consult a qualified healthcare provider for medical decisions. In an emergency, call 911 or your local emergency number.`,
    ],
  },
  {
    id: "purchases",
    title: "Purchases and payments",
    paragraphs: [
      "Prices, packages, and availability are described on the Service and may change. By completing a purchase, you authorize us and our payment partners to charge the stated amount using your selected payment method.",
      "Refunds and cancellations are handled according to the policy stated at the time of purchase or in your service agreement. Accounting records may be maintained through integrated billing systems.",
    ],
  },
  {
    id: "user-content",
    title: "Your content and conduct",
    paragraphs: [
      "You retain ownership of information you submit. You grant us a license to use that information to operate the Service, coordinate care, and improve our offerings.",
      "You agree not to submit unlawful, harassing, or misleading content; interfere with the Service; or attempt unauthorized access to systems or data.",
    ],
  },
  {
    id: "third-party",
    title: "Third-party services and integrations",
    paragraphs: [
      "The Service may link to or integrate with third-party tools (including scheduling, payments, and accounting). Your use of those tools may be subject to separate terms and privacy policies. We are not responsible for third-party services we do not control.",
    ],
  },
  {
    id: "disclaimer",
    title: "Disclaimer of warranties",
    paragraphs: [
      'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT, TO THE MAXIMUM EXTENT PERMITTED BY LAW.',
    ],
  },
  {
    id: "liability",
    title: "Limitation of liability",
    paragraphs: [
      `TO THE MAXIMUM EXTENT PERMITTED BY LAW, ${legalEntity.toUpperCase()} AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.`,
      "Our total liability for claims arising out of these Terms or the Service will not exceed the greater of (a) amounts you paid us for the Service in the twelve months before the claim or (b) one hundred U.S. dollars ($100), except where prohibited by law.",
    ],
  },
  {
    id: "indemnity",
    title: "Indemnification",
    paragraphs: [
      "You agree to indemnify and hold harmless Nurture Collective LLC and its affiliates from claims arising out of your misuse of the Service or violation of these Terms.",
    ],
  },
  {
    id: "termination",
    title: "Termination",
    paragraphs: [
      "We may modify, suspend, or discontinue the Service at any time. You may stop using the Service at any time. Provisions that by their nature should survive termination will survive.",
    ],
  },
  {
    id: "governing-law",
    title: "Governing law",
    paragraphs: [
      "These Terms are governed by the laws of the State of New Jersey, without regard to conflict-of-law principles, except where mandatory consumer protections in your jurisdiction apply.",
    ],
  },
  {
    id: "changes-terms",
    title: "Changes to these Terms",
    paragraphs: [
      "We may update these Terms by posting a revised version on this page. Material changes will be indicated by an updated date. Continued use after changes constitutes acceptance.",
    ],
  },
  {
    id: "contact-terms",
    title: "Contact",
    paragraphs: [
      `Questions about these Terms may be sent to ${legalContactEmail}.`,
    ],
  },
];
