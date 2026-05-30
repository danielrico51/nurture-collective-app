export interface TeamMemberProfile {
  id: string;
  name: string;
  role: string;
  bio: string;
  /** Placeholder until professional headshots are added */
  initials: string;
}

export const teamMembers: TeamMemberProfile[] = [
  {
    id: "alex-burleigh",
    name: "Alex Burleigh",
    role: "CEO",
    bio: "Alex Burleigh leads The Nesting Place and Nurture Collective as we expand maternal wellness support region by region — building the team, provider network, and platform families rely on.",
    initials: "AB",
  },
  {
    id: "barbara-hayer",
    name: "Barbara Hayer",
    role: "Managing Director",
    bio: "Barb helps keep everything running smoothly at The Nesting Place. Families love her calm, friendly nature and the care she takes in coordinating support with warmth and attention. She is often the first reassuring voice parents hear, guiding them through what they need and making sure they feel supported every step of the way.",
    initials: "BH",
  },
];
