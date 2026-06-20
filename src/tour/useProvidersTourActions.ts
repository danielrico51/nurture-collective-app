"use client";

import { PROVIDERS_TOUR_ACTIONS, subscribeTourActions } from "@/tour/providersTourActions";
import {
  PROVIDERS_TOUR_DEMO_DRAFT,
  type ProviderTourFormDraft,
} from "@/tour/providersTourDemo";
import type { ProviderRecord } from "@/types/provider";
import { useEffect } from "react";

export interface ProvidersTourHandlers {
  filtered: ProviderRecord[];
  setShowManualForm: (open: boolean) => void;
  setExpandedId: (id: string | null) => void;
  setTourFormDraft: (draft: ProviderTourFormDraft | null) => void;
}

/** Wire Providers page UI to tour action events (open demo form, expand row, cleanup). */
export const useProvidersTourActions = ({
  filtered,
  setShowManualForm,
  setExpandedId,
  setTourFormDraft,
}: ProvidersTourHandlers) => {
  useEffect(() => {
    return subscribeTourActions((action) => {
      switch (action) {
        case PROVIDERS_TOUR_ACTIONS.OPEN_ADD_FORM_DEMO:
          setExpandedId(null);
          setTourFormDraft(PROVIDERS_TOUR_DEMO_DRAFT);
          setShowManualForm(true);
          break;
        case PROVIDERS_TOUR_ACTIONS.CLOSE_ADD_FORM:
          setShowManualForm(false);
          setTourFormDraft(null);
          break;
        case PROVIDERS_TOUR_ACTIONS.EXPAND_FIRST_PROVIDER: {
          setShowManualForm(false);
          setTourFormDraft(null);
          const first = filtered[0];
          setExpandedId(first?.providerId ?? null);
          break;
        }
        case PROVIDERS_TOUR_ACTIONS.COLLAPSE_PROVIDER:
          setExpandedId(null);
          break;
        case PROVIDERS_TOUR_ACTIONS.CLEANUP:
          setShowManualForm(false);
          setTourFormDraft(null);
          setExpandedId(null);
          break;
        default:
          break;
      }
    });
  }, [filtered, setExpandedId, setShowManualForm, setTourFormDraft]);
};
