import api from "./api";
import type { ContainerInstance } from "../types/container";

export async function createInstance(
  challengeId: number
): Promise<ContainerInstance> {
  const { data } = await api.post<ContainerInstance>("/containers", {
    challenge_id: challengeId,
  });
  return data;
}

export async function listMyInstances(): Promise<ContainerInstance[]> {
  const { data } = await api.get<ContainerInstance[]>("/containers");
  return data;
}

export async function getInstance(
  instanceId: number
): Promise<ContainerInstance> {
  const { data } = await api.get<ContainerInstance>(
    `/containers/${instanceId}`
  );
  return data;
}

export async function stopInstance(instanceId: number): Promise<void> {
  await api.delete(`/containers/${instanceId}`);
}
