import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HeroStat {
  value: number;
  suffix: string;
  label: string;
}

export interface HeroFeature {
  label: string;
  value: string;
  description: string;
}

export interface LandingContent {
  badge: string;
  brandTitle: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  stats: HeroStat[];
  features: HeroFeature[];
}

export const LANDING_CONTENT_KEY = "landing_hero";

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  badge: "India's #1 Smart Aqua Farming Platform",
  brandTitle: "GANGAPUTRA",
  titleLine1: "The Future of",
  titleLine2: "Aqua Farming",
  description:
    "Transform your aquaculture business with real-time IoT monitoring, AI-powered disease detection, live market prices, and a complete farm-to-market ecosystem.",
  primaryCta: "Start Your Farm Journey",
  secondaryCta: "Explore Aquapedia",
  stats: [
    { value: 10000, suffix: "+", label: "Active Farmers" },
    { value: 98, suffix: "%", label: "Success Rate" },
    { value: 24, suffix: "/7", label: "Support" },
    { value: 50, suffix: "+", label: "AI Features" },
  ],
  features: [
    { label: "Water Monitoring", value: "Real-time Sensors", description: "pH, DO, Temp & more" },
    { label: "Disease Detection", value: "AI-Powered", description: "95% accuracy rate" },
    { label: "Smart Automation", value: "IoT Control", description: "Aerators & feeders" },
    { label: "Market Prices", value: "Live Updates", description: "All major markets" },
  ],
};

export const mergeLandingContent = (value: unknown): LandingContent => {
  const raw = (value ?? {}) as Partial<LandingContent>;
  return {
    ...DEFAULT_LANDING_CONTENT,
    ...raw,
    stats: Array.isArray(raw.stats) && raw.stats.length ? raw.stats : DEFAULT_LANDING_CONTENT.stats,
    features:
      Array.isArray(raw.features) && raw.features.length ? raw.features : DEFAULT_LANDING_CONTENT.features,
  };
};

export const fetchLandingContent = async (): Promise<LandingContent> => {
  const { data } = await supabase
    .from("site_content")
    .select("value")
    .eq("key", LANDING_CONTENT_KEY)
    .maybeSingle();
  return mergeLandingContent(data?.value);
};

export const useLandingContent = () => {
  const [content, setContent] = useState<LandingContent>(DEFAULT_LANDING_CONTENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchLandingContent()
      .then((c) => {
        if (active) setContent(c);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { content, loading };
};
