export interface EmployerBenefitPlatform {
  id: string;
  name: string;
  websiteUrl: string;
  summary: string;
  employerFocus: string;
  memberExperience: string;
  relevanceToNestingPlace: string;
}

export const employerBenefitsPageIntro =
  "Many employers do not administer fertility, pregnancy, and postpartum benefits themselves. Instead, they partner with specialized platforms that bundle care navigation, virtual support, and covered services for growing families.";

export const employerBenefitsPageLead =
  "If your company offers a family-building or maternity benefit, you may already have access to support that can help pay for or coordinate doula care, lactation, and postpartum services — even when those benefits are delivered through a third party.";

/** How employer-sponsored programs are usually structured. */
export const howEmployerBenefitsWork = [
  {
    title: "Your employer selects a partner",
    description:
      "Companies choose a platform such as Carrot, ProgenyHealth, or Maven Clinic and include it in your health or wellness benefits package — often at no extra cost to eligible employees.",
  },
  {
    title: "You enroll through the platform",
    description:
      "You create a member account, confirm your eligibility, and see what is covered — fertility care, pregnancy coaching, NICU support, doula access, and more depending on your plan.",
  },
  {
    title: "Care may be in-network or reimbursed",
    description:
      "Some services are delivered inside the platform (virtual visits, care teams). Others — like local birth doula or postpartum support — may be reimbursed after you pay and submit documentation, or coordinated through a benefit wallet.",
  },
  {
    title: "The Nesting Place supports your journey",
    description:
      "We provide in-person and local maternal wellness services in Northern New Jersey. We are happy to help you understand whether your plan may apply and provide the paperwork you need to request reimbursement when eligible.",
  },
];

export const employerBenefitPlatforms: EmployerBenefitPlatform[] = [
  {
    id: "carrot",
    name: "Carrot",
    websiteUrl: "https://www.get-carrot.com/",
    summary:
      "A global fertility and family-building benefits platform used by employers to support IVF, IUI, egg freezing, adoption, surrogacy, pregnancy, and return-to-work.",
    employerFocus:
      "Employers offer Carrot so employees have guided, financially supported paths through fertility treatment and family formation — often with personalized care plans and access to a large provider network.",
    memberExperience:
      "Members work with Carrot coordinators and tools to understand covered services, compare options, and use benefits toward fertility care, pregnancy support, and early parenting — coverage varies by employer.",
    relevanceToNestingPlace:
      "Depending on your employer’s Carrot plan, doula care, lactation, or postpartum support may qualify for reimbursement or benefit dollars. Share your Carrot plan details with us before booking and we will help you gather documentation for submission.",
  },
  {
    id: "progenyhealth",
    name: "ProgenyHealth",
    websiteUrl: "https://www.progenyhealth.com/",
    summary:
      "A maternity and NICU care management partner for health plans and employers, focused on identifying risk early and supporting families through pregnancy and newborn care.",
    employerFocus:
      "Health plans and large employers use ProgenyHealth to manage high-risk pregnancies, reduce NICU admissions, and connect members with case managers and resources across the maternity journey.",
    memberExperience:
      "Eligible members are often engaged early in pregnancy with proactive outreach, care planning, and support for medical and social needs — especially when complications or NICU care are possible.",
    relevanceToNestingPlace:
      "ProgenyHealth is primarily a care management layer rather than a direct payor for doula services. Still, families in managed maternity programs may combine medical care with local doula and postpartum support from The Nesting Place — ask your case manager or benefits team how supplemental wellness services fit your plan.",
  },
  {
    id: "maven",
    name: "Maven Clinic",
    websiteUrl: "https://www.mavenclinic.com/",
    summary:
      "A women’s and family health platform offering virtual care, coaching, and employer-sponsored benefits across fertility, maternity, postpartum, pediatrics, and menopause.",
    employerFocus:
      "Employers and health plans partner with Maven so employees get 24/7 access to specialists — including doulas, lactation consultants, and maternity coaches — often at no out-of-pocket cost when covered.",
    memberExperience:
      "Members use Maven for video visits, messaging, care plans, and navigation through pregnancy and postpartum. Maven lists doula support among its specialties; local in-person care may complement virtual benefits.",
    relevanceToNestingPlace:
      "If your employer offers Maven, check whether doula or postpartum support is included. Maven may cover virtual guidance while The Nesting Place provides hands-on birth doula, overnight newborn, lactation, and postpartum care in your area — we can coordinate with your Maven benefit and supply invoices for reimbursement when your plan allows.",
  },
];

export const nestingPlaceBenefitsRole = {
  title: "How The Nesting Place fits in",
  paragraphs: [
    "We are not a benefits administrator and we are not directly contracted with Carrot, ProgenyHealth, or Maven Clinic today. What we offer is experienced, local maternal wellness care — birth doula support, postpartum care, overnight newborn care, lactation support, and prenatal massage — with a real care coordinator behind every family.",
    "When your employer sponsors one of these platforms, your path often looks like this: confirm your eligibility in the platform, book the clinical or wellness services you need, and use employer-funded benefits or submit claims for covered out-of-network care.",
    "We will walk you through what to ask your HR or benefits team, what documentation we can provide, and how to align your Nesting Place services with your plan — so you can focus on your family instead of paperwork.",
  ],
  checklist: [
    "Ask HR which family benefits platform your company uses (if any).",
    "Log in to your member portal and search for doula, lactation, or postpartum coverage.",
    "Contact us before your first visit with your plan name — we will advise on typical reimbursement steps.",
    "Keep receipts and service summaries we provide for any out-of-network submission.",
  ],
};
