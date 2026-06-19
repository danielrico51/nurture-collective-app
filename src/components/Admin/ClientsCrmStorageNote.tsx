import { describeClientsCrmStorageScope } from "@/lib/clients/config";
import type { ClientsCrmStorageScope } from "@/types/client";

interface ClientsCrmStorageNoteProps {
  storage: ClientsCrmStorageScope | null | undefined;
  prodLabel?: string;
  className?: string;
}

const ClientsCrmStorageNote = ({
  storage,
  prodLabel,
  className = "block mt-1 text-xs text-nurture-charcoal/45",
}: ClientsCrmStorageNoteProps) => {
  if (!storage) return null;
  return (
    <span className={className}>
      {describeClientsCrmStorageScope(storage, { prodLabel })}
    </span>
  );
};

export default ClientsCrmStorageNote;
