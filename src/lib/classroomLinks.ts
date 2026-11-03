import { networkInterfaces, type NetworkInterfaceInfo } from "node:os";

const PATHS = new Set(["/", "/observeit", "/wordleit", "/snapit/scenes"]);
export function classroomLinks(origin: string, pathname: string, interfaces: ReturnType<typeof networkInterfaces> = networkInterfaces()) {
  const current = new URL(origin);
  const route = PATHS.has(pathname) ? pathname : "/";
  if (process.env.VERCEL) return [{ url: new URL(route, current).href, label: "Indirizzo pubblico" }];
  const addresses = Object.entries(interfaces)
    .filter(([name]) => !/^(utun|tun|tap|docker|veth|bridge|br-|vmnet|vbox|tailscale)/i.test(name))
    .flatMap(([, entries]) => entries ?? [])
    .filter((entry: NetworkInterfaceInfo) => entry.family === "IPv4" && !entry.internal && !entry.address.startsWith("169.254."))
    .map(entry => entry.address);
  const unique = [...new Set(addresses)];
  // A URL already used by another laptop is the best known working address.
  unique.sort((a, b) => a === current.hostname ? -1 : b === current.hostname ? 1 : 0);
  return unique.map(address => ({ url: `${current.protocol}//${address}${current.port ? `:${current.port}` : ""}${route}`, label: address }));
}
