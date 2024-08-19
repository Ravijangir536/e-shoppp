import moment from "moment";
import prisma from "@/libs/prismadb";

export default async function getGraphData() {
    try {
        const startDate = moment().subtract(6, "days").startOf("day").toDate();
        const endDate = moment().endOf("day").toDate();

        // Fetch all orders within the date range
        const orders = await prisma.order.findMany({
            where: {
                createDate: {
                    gte: startDate,
                    lte: endDate,
                },
                status: "complete",
            },
            select: {
                createDate: true,
                amount: true,
            },
        });

        // Initialize aggregated data
        const aggregatedData: {
            [day: string]: { day: string; date: string; totalAmount: number };
        } = {};

        let currentDate = moment(startDate);

        // Set up initial data structure for each day
        while (currentDate <= moment(endDate)) {
            const day = currentDate.format("dddd");

            aggregatedData[day] = {
                day,
                date: currentDate.format("YYYY-MM-DD"),
                totalAmount: 0,
            };

            currentDate.add(1, "day");
        }

        // Aggregate amounts by day
        orders.forEach((order: any) => {
            const day = moment(order.createDate).format("dddd");
            const amount = order.amount || 0;
            if (aggregatedData[day]) {
                aggregatedData[day].totalAmount += amount;
            }
        });

        // Format data for output
        const formattedData = Object.values(aggregatedData).sort((a, b) =>
            moment(a.date).diff(moment(b.date))
        );

        return formattedData;
    } catch (error: any) {
        console.error("Error in getGraphData:", error);
        throw new Error(error.message || "An error occurred while fetching graph data.");
    }
}
