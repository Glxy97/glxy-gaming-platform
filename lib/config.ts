import { z } from "zod";

const SettingsSchema = z.object({
  env: z.enum(["dev","staging","prod"]).default("dev"),
  apiBaseUrl: z.string().url().default("http://localhost:3000"),
  features: z.object({ 
    rooms: z.boolean(), 
    achievements: z.boolean() 
  }).default({ rooms: true, achievements: true })
});

export type Settings = z.infer<typeof SettingsSchema>;

const fromEnv = {
  env: (process.env.NEXT_PUBLIC_ENV as Settings["env"]) ?? "dev",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000",
  features: {
    rooms: process.env.NEXT_PUBLIC_FEATURE_ROOMS !== "false",
    achievements: process.env.NEXT_PUBLIC_FEATURE_ACHV !== "false",
  },
};

let _cached: Settings | null = null;

export function getSettings(): Settings { 
  return _cached ?? (_cached = SettingsSchema.parse(fromEnv)); 
}