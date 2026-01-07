import Deal from "../Models/deal.model.js";
import Inquiry from "../Models/inquiry.model.js";
import mongoose from "mongoose";
import Car from "../Models/car.model.js";       // Ensure path is correct


// export const getFranchiseAnalytics = async (req, res) => {
//     try {
//         // 🛠 FIX 1: Wahi ID use kar rahe hain jo purane code me chalti thi
//         const franchiseId = new mongoose.Types.ObjectId(req.user.id);
//         const { range } = req.query;

//         // --- 1. Date Range Filter (Same as Old Code) ---
//         let startDate = new Date();
//         const now = new Date();
//         now.setHours(23, 59, 59, 999);

//         if (range === "Last 7 Days") startDate.setDate(startDate.getDate() - 7);
//         else if (range === "Last 30 Days") startDate.setDate(startDate.getDate() - 30);
//         else if (range === "Last 3 Months") startDate.setMonth(startDate.getMonth() - 3);
//         else if (range === "Last Year") startDate.setFullYear(startDate.getFullYear() - 1);
//         else if (range === "All Time") startDate = new Date(0);
//         else startDate.setMonth(startDate.getMonth() - 6);
//         startDate.setHours(0, 0, 0, 0);

//         // --- 2. Monthly Data (Graph) ---
//         const monthlyStats = await Deal.aggregate([
//             {
//                 $match: {
//                     franchise: franchiseId,
//                     status: "sold", // Case sensitive: Ensure DB has "sold" (lowercase)
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
//                     // 🛠 FIX 2: Agar commission field nahi hai, toh temporarily Price utha rahe hain
//                     // taaki graph khali na dikhe (Baad me isse change kar lena)
//                     revenue: { $sum: { $ifNull: ["$franchiseCommission", "$finalAgreedPrice"] } }, 
//                     totalGMV: { $sum: "$finalAgreedPrice" }
//                 }
//             },
//             { $sort: { "_id.year": 1, "_id.month": 1 } }
//         ]);

//         const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//         const monthlyData = monthlyStats.map(item => ({
//             month: monthNames[item._id.month - 1],
//             sales: item.sales,
//             revenue: item.revenue,
//             totalValue: item.totalGMV
//         }));

//         // --- 3. Lead Conversion (Pie Chart) ---
//         // Pehle Deal status check karte hain
//         const dealStatuses = await Deal.aggregate([
//             { $match: { franchise: franchiseId } },
//             { $group: { _id: "$status", value: { $sum: 1 } } }
//         ]);

//         const soldCount = dealStatuses.find(s => s._id === "sold")?.value || 0;
//         const negotiatingCount = dealStatuses.find(s => ["negotiating", "accepted"].includes(s._id))?.value || 0;
//         const lostCount = dealStatuses.find(s => s._id === "cancelled")?.value || 0;

//         // Fir Inquiries check karte hain
//         const activeInquiries = await Inquiry.countDocuments({ 
//             assignedFranchise: franchiseId, 
//             status: { $in: ["pending", "contacted"] } 
//         });

//         const leadConversionData = [
//             { name: "Sold", value: soldCount, color: "#10b981" },
//             { name: "In Progress", value: negotiatingCount + activeInquiries, color: "#6366f1" },
//             { name: "Lost", value: lostCount, color: "#ef4444" }
//         ];

//         // --- 4. NEW FEATURE: Recent Sales Table (Buyer Details) ---
//         // Ye naya part hai jo purane code me nahi tha
//         const recentSalesRaw = await Deal.find({ 
//             franchise: franchiseId, 
//             status: "sold" 
//         })
//         .sort({ updatedAt: -1 })
//         .limit(5)
//         .populate("car", "make model year registrationNumber images") // Car details
//         .populate("buyer", "fullName email phone"); // Buyer details

//         const recentSales = recentSalesRaw.map(deal => ({
//             id: deal._id,
//             carName: `${deal.car?.year || ''} ${deal.car?.make || 'Unknown'} ${deal.car?.model || ''}`,
//             regNumber: deal.car?.registrationNumber || "N/A",
//             carImage: deal.car?.images?.[0] || "",
//             buyerName: deal.buyer?.fullName || "Guest User",
//             buyerPhone: deal.buyer?.phone || "N/A",
//             salePrice: deal.finalAgreedPrice,
//             // Agar commission set nahi hai, toh 0 dikhayega
//             commission: deal.franchiseCommission || 0, 
//             soldDate: deal.updatedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
//         }));

//         // --- 5. KPI Calculations ---
//         const totalRevenue = monthlyStats.reduce((acc, curr) => acc + curr.revenue, 0);
        
//         // Conversion logic: Sold / Total Inquiries
//         const totalInquiries = await Inquiry.countDocuments({ assignedFranchise: franchiseId });
//         // Adding sold deals to total inquiries count to be safe (agar inquiry DB me entry na ho)
//         const totalOpportunities = totalInquiries + soldCount; 
        
//         const convRate = totalOpportunities > 0 
//             ? ((soldCount / totalOpportunities) * 100).toFixed(1) 
//             : 0;

//         const formatPrice = (val) => val >= 10000000 
//             ? `₹${(val / 10000000).toFixed(2)} Cr` 
//             : `₹${(val / 100000).toFixed(1)} L`;

//         const kpiData = [
//             { 
//                 title: "Total Revenue", 
//                 value: formatPrice(totalRevenue), 
//                 trend: "+10%", trendUp: true, 
//                 description: "Total Earnings", icon: "IndianRupee", color: "emerald" 
//             },
//             { 
//                 title: "Cars Sold", 
//                 value: soldCount.toString(), 
//                 trend: "Units", trendUp: true, 
//                 description: "Delivered", icon: "Car", color: "indigo" 
//             },
//             { 
//                 title: "Active Leads", 
//                 value: (activeInquiries + negotiatingCount).toString(), 
//                 trend: "Live", trendUp: true, 
//                 description: "In Pipeline", icon: "Users", color: "blue" 
//             },
//             { 
//                 title: "Conversion Rate", 
//                 value: `${convRate}%`, 
//                 trend: "Avg", trendUp: true, 
//                 description: "Success Rate", icon: "Target", color: "purple" 
//             }
//         ];

//         res.status(200).json({
//             success: true,
//             data: { monthlyData, leadConversionData, kpiData, recentSales }
//         });

//     } catch (err) {
//         console.error("Stats Error:", err);
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

export const getFranchiseAnalytics = async (req, res) => {
  try {
    // =========================
    // 1. FRANCHISE ID (JWT se)
    // =========================
    if (!req.user?.franchiseId) {
      return res.status(401).json({
        success: false,
        message: "Franchise not authorized"
      });
    }

    const franchiseId = new mongoose.Types.ObjectId(req.user.franchiseId);
    const { range } = req.query;

    // =========================
    // 2. DATE RANGE LOGIC
    // =========================
    let startDate = new Date();
    const endDate = new Date();

    endDate.setHours(23, 59, 59, 999);

    switch (range) {
      case "Last 7 Days":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "Last 30 Days":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "Last 3 Months":
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case "Last Year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case "All Time":
        startDate = new Date(0);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 6);
    }

    startDate.setHours(0, 0, 0, 0);

    // =========================
    // 3. MONTHLY SALES + REVENUE
    // =========================
    const monthlyStats = await Car.aggregate([
      {
        $match: {
          franchise: franchiseId,
          status: "sold",
          $or: [
            { soldDate: { $gte: startDate } },
            { soldDate: null, updatedAt: { $gte: startDate } }
          ]
        }
      },
      {
        $group: {
          _id: {
            month: {
              $month: { $ifNull: ["$soldDate", "$updatedAt"] }
            },
            year: {
              $year: { $ifNull: ["$soldDate", "$updatedAt"] }
            }
          },
          sales: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                { $gt: ["$soldPrice", 0] },
                "$soldPrice",
                "$expectedPrice"
              ]
            }
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    const monthlyData = monthlyStats.map(m => ({
      month: monthNames[m._id.month - 1],
      sales: m.sales,
      revenue: m.revenue,
      totalValue: m.revenue
    }));

    // =========================
    // 4. LEAD CONVERSION
    // =========================
    const soldCount = await Car.countDocuments({
      franchise: franchiseId,
      status: "sold"
    });

    const activeLeads = await Inquiry.countDocuments({
      assignedFranchise: franchiseId,
      status: { $in: ["pending", "contacted"] }
    });

    const lostLeads = await Inquiry.countDocuments({
      assignedFranchise: franchiseId,
      status: { $in: ["cancelled", "rejected"] }
    });

    const leadConversionData = [
      { name: "Sold", value: soldCount, color: "#10b981" },
      { name: "In Progress", value: activeLeads, color: "#6366f1" },
      { name: "Lost", value: lostLeads, color: "#ef4444" }
    ];

    // =========================
    // 5. RECENT SALES TABLE
    // =========================
    const recentSalesRaw = await Car.find({
      franchise: franchiseId,
      status: "sold"
    })
      .sort({ soldDate: -1, updatedAt: -1 })
      .limit(5)
      .populate("soldTo", "fullName phone");

    const recentSales = recentSalesRaw.map(car => ({
      id: car._id,
      carName: `${car.year} ${car.make} ${car.model}`,
      regNumber: car.registrationNumber || "N/A",
      carImage: car.images?.[0] || "",
      buyerName: car.soldTo?.fullName || "Offline Buyer",
      buyerPhone: car.soldTo?.phone || "N/A",
      salePrice: car.soldPrice || car.expectedPrice,
      commission: 0,
      soldDate: car.soldDate
        ? car.soldDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
          })
        : "-"
    }));

    // =========================
    // 6. KPI DATA
    // =========================
    const totalRevenue = monthlyStats.reduce((sum, m) => sum + m.revenue, 0);

    const totalOpportunities = soldCount + activeLeads;
    const conversionRate =
      totalOpportunities > 0
        ? ((soldCount / totalOpportunities) * 100).toFixed(1)
        : "0.0";

    const formatPrice = (value) =>
      value >= 10000000
        ? `₹${(value / 10000000).toFixed(2)} Cr`
        : `₹${(value / 100000).toFixed(1)} L`;

    const kpiData = [
      {
        title: "Total Revenue",
        value: formatPrice(totalRevenue),
        trend: "Earnings",
        trendUp: true,
        description: "From Sold Cars",
        icon: "IndianRupee",
        color: "emerald"
      },
      {
        title: "Cars Sold",
        value: soldCount.toString(),
        trend: "Units",
        trendUp: true,
        description: "Delivered",
        icon: "Car",
        color: "indigo"
      },
      {
        title: "Active Leads",
        value: activeLeads.toString(),
        trend: "Live",
        trendUp: true,
        description: "Inquiries in Pipeline",
        icon: "Users",
        color: "blue"
      },
      {
        title: "Conversion Rate",
        value: `${conversionRate}%`,
        trend: "Avg",
        trendUp: true,
        description: "Success Rate",
        icon: "Target",
        color: "purple"
      }
    ];

    // =========================
    // 7. FINAL RESPONSE
    // =========================
    return res.status(200).json({
      success: true,
      data: {
        monthlyData,
        leadConversionData,
        kpiData,
        recentSales
      }
    });

  } catch (error) {
    console.error("Franchise Analytics Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};