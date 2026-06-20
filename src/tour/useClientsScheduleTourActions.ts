"use client";

import { CLIENTS_TOUR_ACTIONS } from "@/tour/clientsTourActions";
import { buildScheduleTourDemoDraft } from "@/tour/clientsScheduleTourDemo";
import { subscribeTourActions } from "@/tour/providersTourActions";
import type { ServiceEngagementWithDetails } from "@/types/serviceEngagement";
import { useEffect } from "react";

export interface ClientsScheduleTourHandlers {
  engagements: ServiceEngagementWithDetails[];
  setShowForm: (open: boolean) => void;
  setExpandedId: (id: string | null) => void;
  setTourBookDemo: (demo: boolean) => void;
  applyBookDraft: (draft: ReturnType<typeof buildScheduleTourDemoDraft>) => void;
  resetForm: () => void;
}

/** Wire Schedule tab UI to tour action events (book demo form, expand engagement, cleanup). */
export const useClientsScheduleTourActions = ({
  engagements,
  setShowForm,
  setExpandedId,
  setTourBookDemo,
  applyBookDraft,
  resetForm,
}: ClientsScheduleTourHandlers) => {
  useEffect(() => {
    return subscribeTourActions((action) => {
      const first = engagements[0];

      switch (action) {
        case CLIENTS_TOUR_ACTIONS.EXPAND_FIRST_ENGAGEMENT:
          setShowForm(false);
          setTourBookDemo(false);
          resetForm();
          setExpandedId(first?.engagementId ?? null);
          break;
        case CLIENTS_TOUR_ACTIONS.OPEN_SCHEDULE_BOOK_DEMO:
          setExpandedId(null);
          applyBookDraft(buildScheduleTourDemoDraft());
          setTourBookDemo(true);
          setShowForm(true);
          break;
        case CLIENTS_TOUR_ACTIONS.CLOSE_SCHEDULE_BOOK:
          setShowForm(false);
          setTourBookDemo(false);
          resetForm();
          break;
        case CLIENTS_TOUR_ACTIONS.CLEANUP:
          setShowForm(false);
          setTourBookDemo(false);
          resetForm();
          setExpandedId(null);
          break;
        default:
          break;
      }
    });
  }, [
    applyBookDraft,
    engagements,
    resetForm,
    setExpandedId,
    setShowForm,
    setTourBookDemo,
  ]);
};
