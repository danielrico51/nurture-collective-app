"use client";

import IntakeExperience from "@/components/Intake/IntakeExperience";

/** Public concierge intake — no Cognito sign-in required for guests */
const PublicIntakePage = () => <IntakeExperience allowGuest />;

export default PublicIntakePage;
