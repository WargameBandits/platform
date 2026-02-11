export interface ContainerInstance {
  id: number;
  user_id: number;
  challenge_id: number;
  port: number;
  status: "running" | "stopped" | "expired";
  connection_info: string;
  created_at: string;
  expires_at: string;
}
