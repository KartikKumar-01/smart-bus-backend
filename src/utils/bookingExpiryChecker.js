import prisma from "../config/db.js";
import cron from "node-cron"
cron.schedule("*/1 * * * *", async () => {
  const now = new Date();

  const expiredBookings = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lte: now },
    },
  });

  for (const booking of expiredBookings) {
    await prisma.booking.update({
      where: {
        id: booking.id,
      },
      data: { status: "CANCELLED" },
    });
  }

  console.log("Expired bookings checked");
});
