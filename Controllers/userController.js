import carModel from "../Models/car.model.js";
import User from "../Models/user.model.js";
import { uploadFileToSpaces, deleteFileFromSpaces } from "../Services/s3Service.js";
import { ApiError } from "../Utils/apiError.js";
import { STATUS_CODES } from "../Utils/status.codes.messages.js";
import mongoose from 'mongoose'
import Franchise from "../Models/franchise.model.js";


// export const getUserProfile = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.user.id)

//       .select("-password");

//     if (!user) return res.status(404).json({ message: "User not found" });

//     res.status(200).json({
//       message: "User profile fetched successfully",
//       data: user,
//     });
//   } catch (err) {
//     next(err);
//   }
// };


export const getUserProfile = async (req, res, next) => {
  try {
    // 1. User Data layein (Login, Name, Phone)
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Franchise Data layein (Business Name, Bank, Address)
    // Hum 'owner' field se dhoondhenge kyunki Franchise model me 'owner' User ID store karta hai
    const franchise = await Franchise.findOne({ owner: req.user.id });

    // 3. Response me dono data bhejein
    res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      data: {
        user: user,           // Frontend isse user info nikalega
        franchise: franchise  // Frontend isse business info nikalega
      },
    });

  } catch (err) {
    next(err);
  }
};

// export const updateUserProfile = async (req, res, next) => {
//   try {
//     const { fullName, email, phone, country, state, city, pincode } = req.body;

//     const updateData = { fullName, email, phone, country, state, city, pincode };

//     // Handle profile image
//     if (req.file) {
//       const profileImage = await uploadFileToSpaces(req.file, "profile-images");
//       updateData.profileImage = profileImage;
//     }

//     const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
//       new: true,
//     }).select("-password");

//     res.status(200).json({
//       message: "Profile updated successfully",
//       data: updatedUser,
//     });
//   } catch (err) {
//     next(err);
//   }
// };



// export const updateUserProfile = async (req, res, next) => {
//   try {
//     const { fullName, email, phone } = req.body; // Removed pincode, country, state, city

//     const updateData = {
//       fullName,
//       email,
//       phone,
//     };

//     // Remove undefined values
//     Object.keys(updateData).forEach(
//       (key) => updateData[key] === undefined && delete updateData[key]
//     );

//     // Handle profile image
//     if (req.file) {
//       updateData.profileImage = await uploadFileToSpaces(
//         req.file,
//         "profile-images"
//       );
//     }

//     const updatedUser = await User.findByIdAndUpdate(
//       req.user.id,
//       updateData,
//       { new: true }
//     ).select("-password");

//     res.status(200).json({
//       message: "Profile updated successfully",
//       data: updatedUser,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

export const updateUserProfile = async (req, res, next) => {
  try {
    // 1. DATA EXTRACT FROM BODY
    const {
      // Required (Y) Fields
      fullName,       // Contact Person
      email,
      phone,
      franchiseName,

      // Optional (N) Fields
      address,
      bankAccountNumber,
      ifscCode,
      bankName,      
      upiId,       
      workingHours
    } = req.body;

    // 2. VALIDATION (Check 'Y' fields)
    if (!fullName || !email || !phone || !franchiseName) {
      return res.status(400).json({ 
        message: "Required fields missing: Contact Person, Email, Phone, Franchise Name are mandatory." 
      });
    }

    // 3. PREPARE UPDATE OBJECTS
    
    // User Model Update Data (Login Info)
    const userUpdateData = {
      fullName,
      email,
      phone
    };

    // Franchise Model Update Data (Business Info)
    // Note: Hum email/phone/fullName franchise model me bhi update kar rahe hain taaki sync rahe
    const franchiseUpdateData = {
      fullName,
      email,
      phone,
      franchiseName,
      address: address || "", // Agar khali hai to empty string
      bankAccountNumber: bankAccountNumber || "",
        bankName: bankName || "",   // ✅ ADD
       upiId: upiId || "",         // ✅ ADD
      ifscCode: ifscCode || "",
      workingHours: workingHours || ""
    };

    // 4. HANDLE FILE UPLOADS
    // Hum Maan rahe hain ki frontend se fields aise aa rahe hain:
    // profileImage (Single File), documents (Multiple Files)

    if (req.files) {
      // A. Profile Image (Update in both User & Franchise)
      if (req.files.profileImage) {
        const imgUrl = await uploadFileToSpaces(req.files.profileImage[0], "profile-images");
        userUpdateData.profileImage = imgUrl;
        franchiseUpdateData.profileImage = imgUrl;
      }

      // B. Documents Upload (Required: N) -> Add to kycDocuments
      if (req.files.documents) {
        const docUrls = await Promise.all(
          req.files.documents.map(file => uploadFileToSpaces(file, "franchise-docs"))
        );
        
        // MongoDB Logic: $push use karenge taaki purane documents delete na hon
        // Agar replace karna hai, to niche query me logic change hoga
        franchiseUpdateData.newDocs = docUrls; 
      }
    }

    // 5. EXECUTE DATABASE UPDATES
    
    // A. Update User Document
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      userUpdateData,
      { new: true, runValidators: true }
    ).select("-password");

    // B. Update Franchise Document
    // Using findOne({ owner: req.user.id }) kyunki franchise logged in hai
    const franchiseQuery = { ...franchiseUpdateData };
    delete franchiseQuery.newDocs; // Remove temporary field

    let updateOperation = { $set: franchiseQuery };
    
    // Agar naye documents hain to unhe push karo
    if (franchiseUpdateData.newDocs && franchiseUpdateData.newDocs.length > 0) {
        updateOperation.$push = { 
            kycDocuments: { $each: franchiseUpdateData.newDocs } 
        };
    }

    const updatedFranchise = await Franchise.findOneAndUpdate(
      { owner: req.user.id },
      updateOperation,
      { new: true, runValidators: true }
    );

    if (!updatedFranchise) {
        return res.status(404).json({ message: "Franchise profile not found associated with this user." });
    }

    // 6. SEND RESPONSE
    res.status(200).json({
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
        franchise: updatedFranchise
      },
    });

  } catch (err) {
    console.error("Update Profile Error:", err);
    next(err);
  }
};




export const updateUserPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (err) {
    next(err);
  }
};


export const deleteUserProfile = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
      message: "User profile deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};


// export const createUserCarListing = async (req, res, next) => {
//     try {
//         // 1. Body se data nikalo
//         const {
//             sellerName, sellerMobile, sellerEmail,
//             city, pincode,
//             make, model, variant, year, kmDriven,
//             fuelType, transmission,registrationCity,
//             registrationNumber, noOfOwners, expectedPrice, description
//         } = req.body;
 
//         // 2. Validation (Jo fields "Y" hain image mein)
//         if (!sellerName || !sellerMobile || !city || !make || !model || !year || !kmDriven || !fuelType || !transmission) {
//             throw new ApiError(400, "All required fields marked with * must be filled.");
//         }
 
//         // 3. Files Handling (Images & Documents)
//         // req.files['images'] aur req.files['documents'] multer se aayenge
//         let imageUrls = [];
//         let docUrls = [];
 
//         // Upload Car Photos
//         if (req.files && req.files.images && req.files.images.length > 0) {
//              // Promise.all use kar rahe hain taaki saari images parallel upload ho jayein
//              imageUrls = await Promise.all(
//                 req.files.images.map(async (file) => {
//                     return await uploadFileToSpaces(file, "car-images");
//                 })
//             );
//         } else {
//             throw new ApiError(400, "At least one car photo is required.");
//         }
 
//         // Upload Car Documents (agar user ne upload kiye hain)
//         if (req.files && req.files.documents && req.files.documents.length > 0) {
//             docUrls = await Promise.all(
//                 req.files.documents.map(async (file) => {
//                     return await uploadFileToSpaces(file, "car-documents");
//                 })
//             );
//         }
 
//         // 4. Franchise Allocation Logic (Optional abhi ke liye)
//         // Future mein yahan logic aayega: Find Franchise where franchise.pincode === req.body.pincode
//         // Abhi ke liye hum null chhod rahe hain ya manually admin assign karega.
//         const assignedFranchise = null;
 
//         // 5. Database mein Save karna
//         const newCar = await carModel.create({
//             sellerName,
//             sellerMobile,
//             sellerEmail,
//             city,
//             pincode,
//             make,
//             model,
//             variant,
//             year,
//             kmDriven,
//             fuelType,
//             transmission,
//             registrationNumber,
//             noOfOwners,
//             expectedPrice,
//             description,
//             registrationCity  ,    // 🔥 NEW FIELD
//             images: imageUrls,      // S3 Links array
//             documents: docUrls,     // S3 Links array
//             listedBy: req.user.id, // Auth middleware se aayega
//             franchise: assignedFranchise,
//             status: 'pending_verification'
//         });
 
//         return res.status(201).json({
//             success: true,
//             message: "Car listing submitted successfully! Pending verification.",
//             car: newCar
//         });
 
//     } catch (error) {
//         next(error);
//     }
// };
 

export const createUserCarListing = async (req, res, next) => {
    try {
        // 1. Body se data nikalo
        const {
            sellerName, sellerMobile, sellerEmail,
            city, pincode,
            make, model, variant, year, kmDriven,
            fuelType, transmission,registrationCity,
            registrationNumber, noOfOwners, expectedPrice, description
        } = req.body;
 
        // 2. Validation (Jo fields "Y" hain image mein)
        if (!sellerName || !sellerMobile || !city || !make || !model || !year || !kmDriven || !fuelType || !transmission) {
            throw new ApiError(400, "All required fields marked with * must be filled.");
        }
 
        // 3. Files Handling (Images & Documents)
        // req.files['images'] aur req.files['documents'] multer se aayenge
 
       
 
 
        let imageUrls = [];
        let docUrls = [];
 
        // Upload Car Photos
        if (req.files && req.files.images && req.files.images.length > 0) {
             // Promise.all use kar rahe hain taaki saari images parallel upload ho jayein
             imageUrls = await Promise.all(
                req.files.images.map(async (file) => {
                    return await uploadFileToSpaces(file, "car-images");
                })
            );
        } else {
            throw new ApiError(400, "At least one car photo is required.");
        }
 
 
 
          const assignedFranchise = await Franchise.findOne({
      managedPincodes: pincode,
      status: "active",
      verificationStatus: "verified"
    });
 
    if (!assignedFranchise) {
      throw new ApiError(404, "No active franchise found for this pincode");
    }
 
        // Upload Car Documents (agar user ne upload kiye hain)
        if (req.files && req.files.documents && req.files.documents.length > 0) {
            docUrls = await Promise.all(
                req.files.documents.map(async (file) => {
                    return await uploadFileToSpaces(file, "car-documents");
                })
            );
        }
 
        // 4. Franchise Allocation Logic (Optional abhi ke liye)
        // Future mein yahan logic aayega: Find Franchise where franchise.pincode === req.body.pincode
        // Abhi ke liye hum null chhod rahe hain ya manually admin assign karega.
        // const assignedFranchise = null;
 
        // 5. Database mein Save karna
        const newCar = await carModel.create({
            sellerName,
            sellerMobile,
            sellerEmail,
            city,
            pincode,
            make,
            model,
            variant,
            year,
            kmDriven,
            fuelType,
            transmission,
            registrationNumber,
            noOfOwners,
            expectedPrice,
            description,
            registrationCity  ,    // 🔥 NEW FIELD
            images: imageUrls,      // S3 Links array
            documents: docUrls,     // S3 Links array
            listedBy: req.user.id, // Auth middleware se aayega
            franchise: assignedFranchise._id,
            status: 'pending_verification'
        });
 
        return res.status(201).json({
            success: true,
            message: "Car listing submitted successfully! Pending verification.",
            car: newCar
        });
 
    } catch (error) {
        next(error);
    }
};
 