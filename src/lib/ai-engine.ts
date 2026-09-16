/**
 * ai-engine.ts
 * Foundation placeholder for KrishiNethra AI agents.
 * Future: crop-doctor, weather, irrigation, market and voice agents.
 */

export interface AiQuery {
  text: string;
  language: string;
}

export async function askAiAgent(query: AiQuery): Promise<string> {
  void query;
  // TODO: wire offline + online AI agents in later milestones.
  return "AI engine foundation ready. Agents will be implemented next.";
}
