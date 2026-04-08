export interface OverpassNode {
  type: "node";
  id: number;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    opening_hours?: string;
    description?: string;
    "service:bicycle:tools"?: string;
    "service:bicycle:pump"?: string;
    "service:bicycle:repair"?: string;
    "service:bicycle:chain_tool"?: string;
    "service:bicycle:stand"?: string;
    operator?: string;
    [key: string]: string | undefined;
  };
}

export interface OverpassResponse {
  version: number;
  elements: OverpassNode[];
  /** Present when the server encounters a runtime error or timeout. */
  remark?: string;
}
