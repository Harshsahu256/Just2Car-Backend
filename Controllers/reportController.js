import Deal from "../Models/deal.model.js";
import Inquiry from "../Models/inquiry.model.js";
import mongoose from "mongoose";

// export const getFranchiseAnalytics = async (req, res) => {
//     try {
//         const franchiseId = new mongoose.Types.ObjectId(req.user.id); // Authentication middleware se milega
//         const { range } = req.query;

//         // --- 1. Date Range Filter ---
//         let startDate = new Date();
//         if (range === "Last 7 Days") startDate.setDate(startDate.getDate() - 7);
//         else if (range === "Last 30 Days") startDate.setDate(startDate.getDate() - 30);
//         else if (range === "Last 3 Months") startDate.setMonth(startDate.getMonth() - 3);
//         else if (range === "Last Year") startDate.setFullYear(startDate.getFullYear() - 1);
//         else if (range === "All Time") startDate = new Date(0); // Epoch start
//         else startDate.setMonth(startDate.getMonth() - 6); // Default: 6 Months

//         // --- 2. Monthly Data (Bar & Area Charts) ---
//         const monthlyStats = await Deal.aggregate([
//             {
//                 $match: {
//                     franchise: franchiseId,
//                     status: "sold",
//                     updatedAt: { $gte: startDate }
//                 }
//             },
//             {
//                 $group: {
//                     _id: { 
//                         month: { $month: "$updatedAt" }, 
//                         year: { $year: "$updatedAt" } 
//                     },
//                     sales: { $sum: 1 },
//                     revenue: { $sum: "$finalAgreedPrice" }
//                 }
//             },
//             { $sort: { "_id.year": 1, "_id.month": 1 } }
//         ]);

//         const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//         const monthlyData = monthlyStats.map(item => ({
//             month: monthNames[item._id.month - 1],
//             sales: item.sales,
//             revenue: item.revenue,
//             target: Math.round(item.revenue * 1.1) // 10% target increase (mock)
//         }));

//         // --- 3. Lead Conversion Data (Pie Chart) ---
//         const dealStatuses = await Deal.aggregate([
//             { $match: { franchise: franchiseId } },
//             { $group: { _id: "$status", value: { $sum: 1 } } }
//         ]);

//         const leadConversionData = [
//             { name: "Sold", value: dealStatuses.find(s => s._id === "sold")?.value || 0, color: "#10b981" },
//             { name: "In Progress", value: dealStatuses.find(s => ["negotiating", "accepted"].includes(s._id))?.value || 0, color: "#6366f1" },
//             { name: "Lost", value: dealStatuses.find(s => s._id === "cancelled")?.value || 0, color: "#ef4444" }
//         ];

//         // --- 4. KPI Calculations (Top Cards) ---
//         const totalSalesStats = monthlyStats.reduce((acc, curr) => ({
//             rev: acc.rev + curr.revenue,
//             count: acc.count + curr.sales
//         }), { rev: 0, count: 0 });

//         const activeLeadsCount = await Inquiry.countDocuments({ 
//             assignedFranchise: franchiseId, 
//             status: { $in: ["pending", "contacted"] } 
//         });

//         const totalInquiries = await Inquiry.countDocuments({ assignedFranchise: franchiseId });
//         const convRate = totalInquiries > 0 ? ((totalSalesStats.count / totalInquiries) * 100).toFixed(1) : 0;

//         const formatPrice = (val) => val >= 10000000 ? `₹${(val / 10000000).toFixed(2)} Cr` : `₹${(val / 100000).toFixed(1)} L`;

//         const kpiData = [
//             { title: "Total Revenue", value: formatPrice(totalSalesStats.rev), trend: "+18.2%", trendUp: true, description: "Total earnings", icon: "IndianRupee", color: "emerald" },
//             { title: "Cars Sold", value: totalSalesStats.count.toString(), trend: "+12.5%", trendUp: true, description: "Units delivered", icon: "Car", color: "indigo" },
//             { title: "Active Leads", value: activeLeadsCount.toString(), trend: "+8.3%", trendUp: true, description: "Current hot leads", icon: "Users", color: "blue" },
//             { title: "Conversion Rate", value: `${convRate}%`, trend: "-2.1%", trendUp: false, description: "Lead to Sale ratio", icon: "Target", color: "purple" }
//         ];

//         res.status(200).json({
//             success: true,
//             data: { monthlyData, leadConversionData, kpiData }
//         });

//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };





export const getFranchiseAnalytics = async (req, res) => {
    try {
        // 🛠 FIX 1: Wahi ID use kar rahe hain jo purane code me chalti thi
        const franchiseId = new mongoose.Types.ObjectId(req.user.id);
        const { range } = req.query;

        // --- 1. Date Range Filter (Same as Old Code) ---
        let startDate = new Date();
        const now = new Date();
        now.setHours(23, 59, 59, 999);

        if (range === "Last 7 Days") startDate.setDate(startDate.getDate() - 7);
        else if (range === "Last 30 Days") startDate.setDate(startDate.getDate() - 30);
        else if (range === "Last 3 Months") startDate.setMonth(startDate.getMonth() - 3);
        else if (range === "Last Year") startDate.setFullYear(startDate.getFullYear() - 1);
        else if (range === "All Time") startDate = new Date(0);
        else startDate.setMonth(startDate.getMonth() - 6);
        startDate.setHours(0, 0, 0, 0);

        // --- 2. Monthly Data (Graph) ---
        const monthlyStats = await Deal.aggregate([
            {
                $match: {
                    franchise: franchiseId,
                    status: "sold", // Case sensitive: Ensure DB has "sold" (lowercase)
                    updatedAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { 
                        month: { $month: "$updatedAt" }, 
                        year: { $year: "$updatedAt" } 
                    },
                    sales: { $sum: 1 },
                    // 🛠 FIX 2: Agar commission field nahi hai, toh temporarily Price utha rahe hain
                    // taaki graph khali na dikhe (Baad me isse change kar lena)
                    revenue: { $sum: { $ifNull: ["$franchiseCommission", "$finalAgreedPrice"] } }, 
                    totalGMV: { $sum: "$finalAgreedPrice" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyData = monthlyStats.map(item => ({
            month: monthNames[item._id.month - 1],
            sales: item.sales,
            revenue: item.revenue,
            totalValue: item.totalGMV
        }));

        // --- 3. Lead Conversion (Pie Chart) ---
        // Pehle Deal status check karte hain
        const dealStatuses = await Deal.aggregate([
            { $match: { franchise: franchiseId } },
            { $group: { _id: "$status", value: { $sum: 1 } } }
        ]);

        const soldCount = dealStatuses.find(s => s._id === "sold")?.value || 0;
        const negotiatingCount = dealStatuses.find(s => ["negotiating", "accepted"].includes(s._id))?.value || 0;
        const lostCount = dealStatuses.find(s => s._id === "cancelled")?.value || 0;

        // Fir Inquiries check karte hain
        const activeInquiries = await Inquiry.countDocuments({ 
            assignedFranchise: franchiseId, 
            status: { $in: ["pending", "contacted"] } 
        });

        const leadConversionData = [
            { name: "Sold", value: soldCount, color: "#10b981" },
            { name: "In Progress", value: negotiatingCount + activeInquiries, color: "#6366f1" },
            { name: "Lost", value: lostCount, color: "#ef4444" }
        ];

        // --- 4. NEW FEATURE: Recent Sales Table (Buyer Details) ---
        // Ye naya part hai jo purane code me nahi tha
        const recentSalesRaw = await Deal.find({ 
            franchise: franchiseId, 
            status: "sold" 
        })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate("car", "make model year registrationNumber images") // Car details
        .populate("buyer", "fullName email phone"); // Buyer details

        const recentSales = recentSalesRaw.map(deal => ({
            id: deal._id,
            carName: `${deal.car?.year || ''} ${deal.car?.make || 'Unknown'} ${deal.car?.model || ''}`,
            regNumber: deal.car?.registrationNumber || "N/A",
            carImage: deal.car?.images?.[0] || "",
            buyerName: deal.buyer?.fullName || "Guest User",
            buyerPhone: deal.buyer?.phone || "N/A",
            salePrice: deal.finalAgreedPrice,
            // Agar commission set nahi hai, toh 0 dikhayega
            commission: deal.franchiseCommission || 0, 
            soldDate: deal.updatedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        }));

        // --- 5. KPI Calculations ---
        const totalRevenue = monthlyStats.reduce((acc, curr) => acc + curr.revenue, 0);
        
        // Conversion logic: Sold / Total Inquiries
        const totalInquiries = await Inquiry.countDocuments({ assignedFranchise: franchiseId });
        // Adding sold deals to total inquiries count to be safe (agar inquiry DB me entry na ho)
        const totalOpportunities = totalInquiries + soldCount; 
        
        const convRate = totalOpportunities > 0 
            ? ((soldCount / totalOpportunities) * 100).toFixed(1) 
            : 0;

        const formatPrice = (val) => val >= 10000000 
            ? `₹${(val / 10000000).toFixed(2)} Cr` 
            : `₹${(val / 100000).toFixed(1)} L`;

        const kpiData = [
            { 
                title: "Total Revenue", 
                value: formatPrice(totalRevenue), 
                trend: "+10%", trendUp: true, 
                description: "Total Earnings", icon: "IndianRupee", color: "emerald" 
            },
            { 
                title: "Cars Sold", 
                value: soldCount.toString(), 
                trend: "Units", trendUp: true, 
                description: "Delivered", icon: "Car", color: "indigo" 
            },
            { 
                title: "Active Leads", 
                value: (activeInquiries + negotiatingCount).toString(), 
                trend: "Live", trendUp: true, 
                description: "In Pipeline", icon: "Users", color: "blue" 
            },
            { 
                title: "Conversion Rate", 
                value: `${convRate}%`, 
                trend: "Avg", trendUp: true, 
                description: "Success Rate", icon: "Target", color: "purple" 
            }
        ];

        res.status(200).json({
            success: true,
            data: { monthlyData, leadConversionData, kpiData, recentSales }
        });

    } catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

