import { test } from "node:test";
import assert from "node:assert/strict";
import type { NetworkInterfaceInfo } from "node:os";
import { classroomLinks } from "./classroomLinks.ts";
const entry = (address: string, internal = false): NetworkInterfaceInfo => ({ address, family: "IPv4", internal, netmask: "255.255.255.0", mac: "00:00:00:00:00:00", cidr: `${address}/24` });
test("localhost invite uses LAN addresses and keeps game path and server port", () => {
  const links = classroomLinks("http://localhost:3000", "/observeit", { lo0: [entry("127.0.0.1", true)], en0: [entry("192.168.1.20")], utun0: [entry("10.0.0.2")] });
  assert.deepEqual(links, [{ label: "192.168.1.20", url: "http://192.168.1.20:3000/observeit" }]);
});
test("existing reachable address is preferred, duplicates and link-local excluded", () => {
  const links = classroomLinks("http://192.168.1.20:3010", "/wordleit", { en1: [entry("10.0.0.20")], en0: [entry("192.168.1.20"), entry("192.168.1.20"), entry("169.254.1.1")] });
  assert.equal(links.length, 2);
  assert.equal(links[0].url, "http://192.168.1.20:3010/wordleit");
});
test("no connected network yields no misleading localhost URL, unknown paths go home", () => {
  assert.deepEqual(classroomLinks("http://localhost:3000", "/", {}), []);
  const links = classroomLinks("http://localhost:3000", "//other.example", { en0: [entry("192.168.1.20")] });
  assert.equal(links[0].url, "http://192.168.1.20:3000/");
});
