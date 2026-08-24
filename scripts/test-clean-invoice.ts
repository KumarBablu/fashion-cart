import { generateInvoiceBufferForOrder } from "../lib/invoice/generate";
import dotenv from "dotenv";

dotenv.config();

async function testInvoice() {
  const result = await generateInvoiceBufferForOrder("cmt7fasji0001jp04g6txk23b");
  console.log("✅ PDF Generated successfully! Size:", result.buffer.length, "bytes. Invoice #:", result.invoiceNumber);
}

testInvoice().catch(console.error);
