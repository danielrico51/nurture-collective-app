"use client";

import { CLIENTS_TOUR_ACTIONS } from "@/tour/clientsTourActions";
import {
  CLIENTS_TOUR_DEMO_DRAFT,
  type ClientTourDetailTab,
  type ClientTourFormDraft,
} from "@/tour/clientsTourDemo";
import { subscribeTourActions } from "@/tour/providersTourActions";
import type { ClientRecord } from "@/types/client";
import { useEffect } from "react";

export interface ClientsTourHandlers {
  filtered: ClientRecord[];
  setShowManualForm: (open: boolean) => void;
  setExpandedId: (id: string | null) => void;
  setTourFormDraft: (draft: ClientTourFormDraft | null) => void;
  setTourDetailTab: (tab: ClientTourDetailTab | null) => void;
}

/** Wire Client CRM UI to tour action events. */
export const useClientsTourActions = ({
  filtered,
  setShowManualForm,
  setExpandedId,
  setTourFormDraft,
  setTourDetailTab,
}: ClientsTourHandlers) => {
  useEffect(() => {
    return subscribeTourActions((action) => {
      const first = filtered[0];

      switch (action) {
        case CLIENTS_TOUR_ACTIONS.OPEN_ADD_FORM_DEMO:
          setExpandedId(null);
          setTourDetailTab(null);
          setTourFormDraft(CLIENTS_TOUR_DEMO_DRAFT);
          setShowManualForm(true);
          break;
        case CLIENTS_TOUR_ACTIONS.CLOSE_ADD_FORM:
          setShowManualForm(false);
          setTourFormDraft(null);
          break;
        case CLIENTS_TOUR_ACTIONS.EXPAND_FIRST_OVERVIEW:
          setShowManualForm(false);
          setTourFormDraft(null);
          setExpandedId(first?.clientId ?? null);
          setTourDetailTab("overview");
          break;
        case CLIENTS_TOUR_ACTIONS.EXPAND_FIRST_SCHEDULE:
          setShowManualForm(false);
          setTourFormDraft(null);
          setExpandedId(first?.clientId ?? null);
          setTourDetailTab("schedule");
          break;
        case CLIENTS_TOUR_ACTIONS.EXPAND_FIRST_SERVICES:
          setShowManualForm(false);
          setTourFormDraft(null);
          setExpandedId(first?.clientId ?? null);
          setTourDetailTab("services");
          break;
        case CLIENTS_TOUR_ACTIONS.EXPAND_FIRST_COMMUNICATIONS:
          setShowManualForm(false);
          setTourFormDraft(null);
          setExpandedId(first?.clientId ?? null);
          setTourDetailTab("communications");
          break;
        case CLIENTS_TOUR_ACTIONS.COLLAPSE_CLIENT:
          setExpandedId(null);
          setTourDetailTab(null);
          break;
        case CLIENTS_TOUR_ACTIONS.CLEANUP:
          setShowManualForm(false);
          setTourFormDraft(null);
          setExpandedId(null);
          setTourDetailTab(null);
          break;
        default:
          break;
      }
    });
  }, [
    filtered,
    setExpandedId,
    setShowManualForm,
    setTourDetailTab,
    setTourFormDraft,
  ]);
};
