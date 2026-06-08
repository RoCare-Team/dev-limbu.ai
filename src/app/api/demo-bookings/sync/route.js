// app/api/demo-bookings/sync/route.js

export async function POST(request) {
  try {
    await dbConnect();

    const pendingBookings = await DemoBooking.find({ userCreated: false });
    const results = { success: 0, skipped: 0, errors: 0 };

    for (const booking of pendingBookings) {
      try {
        const existingUser = await User.findOne({ phone: booking.phone });

        if (!existingUser) {
          const assignedAgent = await getNextAgent();
          const totalUsers = await User.countDocuments();

          await User.create({
            userId: `USR${Date.now()}${totalUsers + 1}`,
            fullName: booking.name,
            phone: booking.phone,
            email: `${booking.phone}@demo.com`,
            source: "chatbot",
            leadStage: "Active",
            leadStatus: "",
            assignedAgentId: assignedAgent?._id || null,
            accountManager: assignedAgent?._id || null,
            accountManagerName: assignedAgent?.fullName || null,
            isServiceBooked: true,
          });

          const agentPhone = getAgentPhoneByName(assignedAgent?.fullName);

          if (agentPhone) {
            await sendAgentLeadAssignedTemplate({
              agentName: assignedAgent.fullName,
              agentPhone,
              customerName: booking.name,
              customerPhone: booking.phone,
              selectedDate: booking.selectedDate,
              seminarTime: booking.seminarTime,
            });
          } else {
            console.warn(`Agent "${assignedAgent?.fullName}" not in AGENT_PHONE_MAP. Template skipped.`);
          }

          results.success++;
        } else {
          results.skipped++;
        }

        booking.userCreated = true;
        await booking.save();
      } catch (err) {
        results.errors++;
        console.error("Sync error:", booking._id, err);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}