export interface TeamMemberProfile {
  id: string;
  name: string;
  role: string;
  bio: string;
  initials: string;
  /** Optional headshot under /public (e.g. /images/team/alex-burleigh.jpg) */
  imageSrc?: string;
  imageAlt?: string;
}

export const teamMembers: TeamMemberProfile[] = [
  {
    id: "alex-burleigh",
    name: "Alex Burleigh",
    role: "Owner & Director",
    bio: "Alex leads The Nesting Place with a mother’s perspective and a coordinator’s care. Her own path through fertility challenges, career, and motherhood — raising a young daughter while welcoming another — shaped her conviction that every family deserves steady, personalized support from pregnancy through postpartum.",
    initials: "AB",
    imageSrc: "/images/team/alex-burleigh.png",
    imageAlt: "Alex Burleigh, Owner and Director of The Nesting Place",
  },
  {
    id: "barbara-hayer",
    name: "Barbara Hayer",
    role: "Managing Director",
    bio: "Barb is a cornerstone of The Nesting Place’s leadership — overseeing operations and guiding both clients and team members with the calm, attentive coordination families trust. Her deep knowledge of the practice and lasting relationships across the team keep support organized, warm, and reliable every step of the way.",
    initials: "BH",
    imageSrc: "/images/team/barbara-hayer.jpeg",
    imageAlt: "Barbara Hayer, Managing Director at The Nesting Place",
  },
];
