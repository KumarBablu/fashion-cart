import { getDb } from "../lib/db";
import { syncUserToStore, getStoreUser } from "../lib/auth/session";

async function main() {
  const garmentsDb = getDb("garments");
  const jewelleryDb = getDb("jewellery");

  // Get master user from garments
  const user = await garmentsDb.user.findUnique({
    where: { email: "kumar.bablu9547.sv@gmail.com" },
  });

  if (!user) {
    console.log("Master user not found");
    return;
  }

  console.log("Master user from Garments:", user.id, user.email);

  // Sync user to jewellery
  const jwUser = await syncUserToStore(user, "jewellery");
  console.log("Synced user in Jewellery DB:", jwUser.id, jwUser.email);

  // Check addresses for this user
  const garmentsAddress = await garmentsDb.address.findFirst({
    where: { user: { email: user.email } },
  });

  console.log("Garments address found:", garmentsAddress?.id, garmentsAddress?.fullName);

  if (garmentsAddress) {
    // Upsert address into jewellery DB using jwUser.id
    const upsertedAddress = await jewelleryDb.address.upsert({
      where: { id: garmentsAddress.id },
      update: {
        userId: jwUser.id,
        fullName: garmentsAddress.fullName,
        mobileNumber: garmentsAddress.mobileNumber,
        addressLine1: garmentsAddress.addressLine1,
        addressLine2: garmentsAddress.addressLine2,
        city: garmentsAddress.city,
        state: garmentsAddress.state,
        pinCode: garmentsAddress.pinCode,
        landmark: garmentsAddress.landmark,
        isDefault: garmentsAddress.isDefault,
      },
      create: {
        id: garmentsAddress.id,
        userId: jwUser.id,
        fullName: garmentsAddress.fullName,
        mobileNumber: garmentsAddress.mobileNumber,
        addressLine1: garmentsAddress.addressLine1,
        addressLine2: garmentsAddress.addressLine2,
        city: garmentsAddress.city,
        state: garmentsAddress.state,
        pinCode: garmentsAddress.pinCode,
        landmark: garmentsAddress.landmark,
        isDefault: garmentsAddress.isDefault,
      },
    });

    console.log("Successfully upserted address into Jewellery DB:", upsertedAddress.id, upsertedAddress.userId);
  }
}

main().catch(console.error);
