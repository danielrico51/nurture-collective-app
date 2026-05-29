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
    id: "alison-herman",
    name: "Alison Herman",
    role: "Founder & CEO",
    bio: "Alison Herman, LCSW, has spent more than 20 years supporting families through her work as a therapist and perinatal professional, helping parents feel confident during pregnancy, birth, and the early weeks at home with their baby. Known for her gentle, kind, and steady approach, Alison has shaped The Nesting Place into a trusted and nurturing resource for new parents.",
    initials: "AH",
  },
  {
    id: "barbara-hayer",
    name: "Barbara Hayer",
    role: "Managing Director",
    bio: "Barb helps keep everything running smoothly at The Nesting Place. Families love her calm, friendly nature and the care she takes in coordinating support with warmth and attention. She is often the first reassuring voice parents hear, guiding them through what they need and making sure they feel supported every step of the way.",
    initials: "BH",
  },
  {
    id: "alex",
    name: "Alex",
    role: "Care Coordinator",
    bio: "Alex works closely with Barb and our care team to connect families with the right support at the right time. From your first call through every step of your care plan, Alex is a real person on the other end — listening, answering questions, and making sure you never feel alone in the process.",
    initials: "A",
  },
];
