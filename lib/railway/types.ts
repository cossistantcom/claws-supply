export type RailwayDeploymentStatus =
  | "BUILDING"
  | "DEPLOYING"
  | "SUCCESS"
  | "FAILED"
  | "CRASHED"
  | "REMOVED"
  | "SLEEPING"
  | "SKIPPED"
  | "WAITING"
  | "QUEUED"
  | "UNKNOWN";

export interface RailwayService {
  id: string;
  name: string;
}

export interface RailwayDeployment {
  id: string;
  status: RailwayDeploymentStatus;
  staticUrl: string | null;
  url: string | null;
}

export interface RailwayGraphQLError {
  message?: string;
}

export interface RailwayGraphQLResponse<TData> {
  data?: TData;
  errors?: RailwayGraphQLError[];
}
