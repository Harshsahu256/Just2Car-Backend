import Package from "../Models/package.model.js";
import { ApiError } from "../Utils/apiError.js";

/**
 * CREATE PACKAGE
 * Admin & Franchise
 */
export const createPackage = async (req, res, next) => {
  try {
    const {
      name,
      price,
      packageType, // CAR_LISTING | FRANCHISE | ADS
      carListingLimit,
      validityDays,
      commissionPercent,
      adSlots,
      description,
    } = req.body;

    if (!name || !packageType) {
      throw new ApiError(400, "Name and packageType are required");
    }

    const pkg = await Package.create({
      createdBy: req.user.id,
      creatorRole: req.user.role, // admin | franchise
      name,
      price,
      packageType,
      carListingLimit,
      validityDays,
      commissionPercent,
      adSlots,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Package created successfully",
      data: pkg,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ALL PACKAGES
 * Admin → all
 * Franchise → admin + own
 */
export const getAllPackages = async (req, res, next) => {
  try {
    let filter = { isActive: true };

    if (req.user.role === "franchise") {
      filter.$or = [
        { creatorRole: "admin" },
        { createdBy: req.user.id },
      ];
    }

    const packages = await Package.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: packages.length,
      data: packages,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET SINGLE PACKAGE
 */
export const getPackageById = async (req, res, next) => {
  try {
    const pkg = await Package.findById(req.params.id);

    if (!pkg) throw new ApiError(404, "Package not found");

    res.status(200).json({
      success: true,
      data: pkg,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE PACKAGE
 * Only owner (admin / franchise)
 */
export const updatePackage = async (req, res, next) => {
  try {
    const pkg = await Package.findById(req.params.id);

    if (!pkg) throw new ApiError(404, "Package not found");

    if (pkg.createdBy.toString() !== req.user.id) {
      throw new ApiError(403, "Not allowed to update this package");
    }

    Object.assign(pkg, req.body);
    await pkg.save();

    res.status(200).json({
      success: true,
      message: "Package updated successfully",
      data: pkg,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE PACKAGE (Soft delete)
 */
export const deletePackage = async (req, res, next) => {
  try {
    const pkg = await Package.findById(req.params.id);

    if (!pkg) throw new ApiError(404, "Package not found");

    if (pkg.createdBy.toString() !== req.user.id) {
      throw new ApiError(403, "Not allowed to delete this package");
    }

    pkg.isActive = false;
    await pkg.save();

    res.status(200).json({
      success: true,
      message: "Package deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};



export const getFranchisePackages = async (req, res, next) => {
  try {
    // Sirf wahi packages jo "FRANCHISE" type ke hain
    let filter = { 
        isActive: true, 
        packageType: "FRANCHISE" 
    };



    const packages = await Package.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: packages.length,
      message: "All Franchise Packages",
      data: packages,
    });
  } catch (err) {
    next(err);
  }
};


export const getCarListingPackages = async (req, res, next) => {
  try {
    // Sirf wahi packages jo "CAR_LISTING" type ke hain
    let filter = { 
        isActive: true, 
        packageType: "CAR_LISTING" 
    };

    // if (req.user.role === "franchise") {
    //   filter.$and = [
    //     { packageType: "CAR_LISTING" },
    //     {
    //       $or: [
    //         { creatorRole: "admin" },
    //         { createdBy: req.user.id }
    //       ]
    //     }
    //   ];
    // }

    const packages = await Package.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: packages.length,
      message: "All Car Listing Packages",
      data: packages,
    });
  } catch (err) {
    next(err);
  }
};