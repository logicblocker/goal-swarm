// stores/goalSwarmStore.ts

import { v4 } from "uuid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  defaultAgentSettings,
  hookRootUpToServerGraph,
  rootPlanId,
  type AgentSettings,
} from "@acme/agent";
import {
  type DraftExecutionGraph,
  type Execution,
  type ExecutionPlusGraph,
  type GoalPlusExe,
} from "@acme/db";

import { app } from "~/constants";

export interface GoalSwarmMachineStore {
  isRunning: boolean;
  setIsRunning: (newState: boolean) => void;
  isAutoStartEnabled: boolean;
  setIsAutoStartEnabled: (newState: boolean) => void;
  agentSettings: Record<"plan" | "review" | "execute", AgentSettings>;
  setAgentSettings: (
    type: "plan" | "review" | "execute",
    newValue: Partial<AgentSettings>,
  ) => void;
  execution: ExecutionPlusGraph | null;
  setExecution: (
    newExecution: ExecutionPlusGraph | undefined | null,
    goalPrompt: string,
  ) => void;
  graph: DraftExecutionGraph;
  setGraph: (newGraph: DraftExecutionGraph, goalPrompt: string) => void;
}

export const draftExecutionPrefix = "draft-";
export const newDraftExecutionId = () => `${draftExecutionPrefix}${v4()}`;

export function createDraftExecution(selectedGoal: GoalPlusExe) {
  const executionId = newDraftExecutionId();
  const goalId = selectedGoal.id;
  const draftExecution: Execution = {
    id: executionId,
    goalId,
    userId: "guest",
    state: "EXECUTING",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return draftExecution;
}

const useGoalSwarmMachineStore = create(
  persist<GoalSwarmMachineStore>(
    (set, _get) => ({
      isRunning: false,
      setIsRunning: (newState) => set({ isRunning: newState }),
      isAutoStartEnabled: false,
      setIsAutoStartEnabled: (newState) =>
        set({ isAutoStartEnabled: newState }),
      agentSettings: defaultAgentSettings,
      setAgentSettings: (type, newValue) =>
        set((state) => ({
          agentSettings: {
            ...state.agentSettings,
            [type]: { ...state.agentSettings[type], ...newValue },
          },
        })),
      execution: null,
      setExecution: (newExecution, goalPrompt) => {
        console.debug("setExecution", newExecution);
        set(() => ({
          execution: newExecution || null,
          graph:
            (newExecution?.graph &&
              hookRootUpToServerGraph(
                newExecution.graph,
                rootPlanId,
                newExecution.id,
                goalPrompt,
              )) ||
            hookRootUpToServerGraph(
              {
                nodes: [],
                edges: [],
                executionId: "",
              },
              rootPlanId,
              goalPrompt,
            ),
        }));
      },
      graph: {
        nodes: [],
        edges: [],
        executionId: "",
      } as DraftExecutionGraph,
      setGraph: (graph, goalPrompt) => {
        set((state) => ({
          graph: hookRootUpToServerGraph(
            graph,
            rootPlanId,
            goalPrompt,
            state.execution?.id,
          ),
        }));
      },
    }),
    {
      name: app.localStorageKeys.goalSwarm,
      storage: createJSONStorage(() => sessionStorage), // alternatively use: localStorage
      partialize: (state: GoalSwarmMachineStore) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !["isRunning"].includes(key)),
        ) as GoalSwarmMachineStore,
    },
  ),
);

export default useGoalSwarmMachineStore;
