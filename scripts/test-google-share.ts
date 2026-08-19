async function testUrl() {
  const url = "https://share.google/m3BVEgIXjgv7CVtoA";
  try {
    const res = await fetch(url, { redirect: "follow" });
    console.log("Status:", res.status);
    console.log("Final URL:", res.url);
    console.log("Content-Type:", res.headers.get("content-type"));
    const text = await res.text();
    console.log("Response sample:", text.slice(0, 500));
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testUrl();
