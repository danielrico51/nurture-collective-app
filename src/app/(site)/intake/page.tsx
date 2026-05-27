"use client";

import IntakeExperience from "@/components/Intake/IntakeExperience";

/** Public dev intake — no Cognito sign-in when NEXT_PUBLIC_INTAKE_PUBLIC=true */
const PublicIntakePage = () => <IntakeExperience allowGuest />;

export default PublicIntakePage;
