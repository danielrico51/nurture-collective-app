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
    role: "Owner",
    bio: "Alex is excited to pick up the torch from Alison and lead The Nesting Place and Nurture Collective — growing the team and provider network so more moms and families feel supported every step of the way.",
    initials: "AB",
    imageSrc: "/images/team/alex-burleigh.png",
    imageAlt: "Alex Burleigh, Owner of The Nesting Place",
  },
  {
    id: "alison-herman",
    name: "Alison Herman",
    role: "Founder",
    bio: "Alison Herman, LCSW, has spent more than 20 years supporting families through her work as a therapist and perinatal professional, helping parents feel confident during pregnancy, birth, and the early weeks at home with their baby. Known for her gentle, kind, and steady approach, Alison shaped The Nesting Place into a trusted and nurturing resource for new parents.",
    initials: "AH",
    imageSrc: "/images/team/alison-herman.jpg",
    imageAlt: "Alison Herman, Founder of The Nesting Place",
  },
  {
    id: "barbara-hayer",
    name: "Barbara Hayer",
    role: "Managing Director",
    bio: "Barb helps keep everything running smoothly at The Nesting Place. Families love her calm, friendly nature and the attention she takes in coordinating support with warmth. She is often the first reassuring voice parents hear, guiding them through what they need and making sure they feel supported every step of the way.",
    initials: "BH",
    imageSrc: "/images/team/barbara-hayer.jpeg",
    imageAlt: "Barbara Hayer, Managing Director at The Nesting Place",
  },
];
