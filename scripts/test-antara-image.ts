async function test() {
  const url = "https://www.antarajewellery.com/wp-content/uploads/2023/07/1-1-scaled.jpg";
  try {
    const res = await fetch(url);
    console.log("Status:", res.status);
    console.log("Headers:", Object.fromEntries(res.headers.entries()));
    const buffer = await res.arrayBuffer();
    console.log("Length:", buffer.byteLength);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
