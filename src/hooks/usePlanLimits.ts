import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LANDING_LIMITS, BANNER_LIMITS } from "@/lib/constants";

interface PlanLimits {
  landing: Record<string, number>;
  banner: Record<string, number>;
  loading: boolean;
}

export function usePlanLimits(): PlanLimits {
  const [landing, setLanding] = useState<Record<string, number>>(LANDING_LIMITS);
  const [banner, setBanner] = useState<Record<string, number>>(BANNER_LIMITS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("system_config")
        .select("key, value")
        .in("key", ["plan_limits", "banner_limits"]);

      if (data) {
        for (const row of data) {
          const val = row.value as Record<string, number>;
          if (row.key === "plan_limits" && val) setLanding({ ...LANDING_LIMITS, ...val });
          if (row.key === "banner_limits" && val) setBanner({ ...BANNER_LIMITS, ...val });
        }
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { landing, banner, loading };
}
