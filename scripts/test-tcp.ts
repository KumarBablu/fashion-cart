import net from "net";
import dns from "dns";

async function testTcp(host: string, port: number): Promise<string> {
  return new Promise((resolve) => {
    console.log(`Testing TCP connection to ${host}:${port}...`);
    const socket = new net.Socket();
    socket.setTimeout(4000);

    socket.connect(port, host, () => {
      socket.destroy();
      resolve(`✅ TCP Connected to ${host}:${port} successfully!`);
    });

    socket.on("error", (err) => {
      socket.destroy();
      resolve(`❌ TCP Error on ${host}:${port}: ${err.message}`);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(`❌ TCP Timeout on ${host}:${port}`);
    });
  });
}

async function run() {
  dns.lookup("aws-0-ap-southeast-2.pooler.supabase.com", (err, address, family) => {
    console.log("DNS Lookup aws-0-ap-southeast-2.pooler.supabase.com:", address, "Family IPv", family, err?.message || "OK");
  });

  const res1 = await testTcp("aws-0-ap-southeast-2.pooler.supabase.com", 6543);
  console.log(res1);

  const res2 = await testTcp("aws-0-ap-southeast-2.pooler.supabase.com", 5432);
  console.log(res2);

  const res3 = await testTcp("aws-0-ap-south-1.pooler.supabase.com", 6543);
  console.log("Existing Garments DB (ap-south-1):", res3);
}

run();
