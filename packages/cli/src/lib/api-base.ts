import { DEFAULT_API_BASE, LOCAL_DEV_API_BASE } from "./constants";

export function resolveApiBase(dev = false): string {
  return dev ? LOCAL_DEV_API_BASE : DEFAULT_API_BASE;
}
