import jwt from 'jsonwebtoken';
import { ApiError } from '../Utils/apiError.js';
import { MESSAGES, STATUS_CODES } from '../Utils/status.codes.messages.js';
import User from '../Models/user.model.js';

// ================= AUTHENTICATE USER =================
// export const authenticate = async (req, res, next) => {
//   const token = req.header("Authorization")?.replace("Bearer ", "");

//   if (!token) {
//     return next(new ApiError(STATUS_CODES.UNAUTHORIZED, `${MESSAGES.UNAUTHORIZED}: No token provided.`));
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     const user = await User.findById(decoded.id);

//     if (!user) {
//       return next(new ApiError(STATUS_CODES.UNAUTHORIZED, `${MESSAGES.UNAUTHORIZED}: User associated with token not found.`));
//     }

//     req.user = user;
//     next();

//   } catch (error) {
//     if (error.name === "TokenExpiredError") {
//       return next(new ApiError(STATUS_CODES.UNAUTHORIZED, MESSAGES.TOKEN_EXPIRED));
//     }
//     return next(new ApiError(STATUS_CODES.UNAUTHORIZED, MESSAGES.TOKEN_INVALID));
//   }
// };


// export const authenticate = async (req, res, next) => {
//   const token = req.header("Authorization")?.replace("Bearer ", "");

//   if (!token) {
//     return next(new ApiError(401, "No token provided"));
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     req.userId = decoded.userId;
//     req.role = decoded.role;
//     req.franchiseId = decoded.franchiseId || null;
//     req.dealerId = decoded.dealerId || null;

//     next();
//   } catch (err) {
//     next(new ApiError(401, "Invalid token"));
//   }
// };

export const authenticate = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return next(
      new ApiError(STATUS_CODES.UNAUTHORIZED, MESSAGES.UNAUTHORIZED)
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("_id role isActive");

    if (!user || user.isActive === false) {
      return next(
        new ApiError(STATUS_CODES.UNAUTHORIZED, "User not authorized")
      );
    }

    req.user = {
      id: user._id,
      role: user.role,
      franchiseId: decoded.franchiseId || null,
      dealerId: decoded.dealerId || null,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(
        new ApiError(STATUS_CODES.UNAUTHORIZED, MESSAGES.TOKEN_EXPIRED)
      );
    }
    next(new ApiError(STATUS_CODES.UNAUTHORIZED, MESSAGES.TOKEN_INVALID));
  }
};

// ================= ROLE CHECK =================
export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return next(new ApiError(STATUS_CODES.FORBIDDEN, `${MESSAGES.FORBIDDEN}: Admin access required.`));
  }
  next();
};

export const isSubAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "subadmin") {
    return next(new ApiError(STATUS_CODES.FORBIDDEN, `${MESSAGES.FORBIDDEN}: Subadmin access required.`));
  }
  next();
};

export const isDealer = (req, res, next) => {
  if (!req.user || req.user.role !== "dealer") {
    return next(new ApiError(STATUS_CODES.FORBIDDEN, `${MESSAGES.FORBIDDEN}: Dealer access required.`));
  }
  next();
};

// export const isFranchise = (req, res, next) => {
//   if (!req.user || req.user.role !== "franchise") {
//     return next(new ApiError(STATUS_CODES.FORBIDDEN, `${MESSAGES.FORBIDDEN}: Franchise access required.`));
//   }
//   next();
// };

export const isFranchise = (req, res, next) => {
  if (
    !req.user ||
    req.user.role !== "franchise" ||
    !req.user.franchiseId
  ) {
    return next(new ApiError(403, "Franchise access required"));
  }
  next();
};

// export const isFranchise = (req, res, next) => {
//   if (req.role !== "franchise" || !req.franchiseId) {
//     return next(new ApiError(403, "Franchise access required"));
//   }
//   next();
// };

export const isUser = (req, res, next) => {
  if (!req.user || req.user.role !== "user") {
    return next(new ApiError(STATUS_CODES.FORBIDDEN, `${MESSAGES.FORBIDDEN}: User role required.`));
  }
  next();
};


export const isInspector = (req, res, next) => {
  if (!req.user || req.user.role !== "inspector") {
    return next(new ApiError(STATUS_CODES.FORBIDDEN, `${MESSAGES.FORBIDDEN}: Inspector access required.`));
  }
  next();
}
 