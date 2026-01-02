

import multer from "multer";
import { MESSAGES } from "../Utils/status.codes.messages.js";


const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/", // all images
    "video/", // all videos
    "application/pdf", // pdf
    "application/msword", // doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
    "application/vnd.ms-excel", // xls
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
    "text/plain" // txt
  ];


  if (allowedTypes.some(type => file.mimetype.startsWith(type) || file.mimetype === type)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        MESSAGES.VALIDATION_ERROR + ": Invalid file type! Only media or document files are allowed."
      ),
      false
    );
  }
};


const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
    fieldSize: 10 * 1024 * 1024 // 10MB for text fields (safe limit)
  }
});

export default upload;
