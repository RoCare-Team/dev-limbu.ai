import dbConnect from "@/lib/dbConnect";
import Pricing from "@/models/Pricing";

export async function GET() {
    try {
        await dbConnect();

        let pricing = await Pricing.findOne();

        // If no pricing exists → create default
        if (!pricing) {
            pricing = await Pricing.create({});
        }

        return Response.json({
            success: true,
            data: pricing,
        });
    } catch (error) {
        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 500 }
        );
    }
}