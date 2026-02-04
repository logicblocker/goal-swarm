// app/nextjs/src/constants.ts

export const app = {
  name: "goal-swarm",
  description: "Automate complex tasks with swarms of LLMs",
  version: process.env.NEXT_PUBLIC_APP_VERSION ?? "preview",
  localStorageKeys: {
    goal: "AGI:MERGE:GOAL:STORE",
    alerts: "AGI:MERGE:ALERTS:STORE",
    goalSwarm: "AGI:MERGE:GOAL:SWARM:STORE",
  },
};
