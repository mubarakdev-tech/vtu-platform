import multer from "multer";

// Store uploaded files temporarily in memory
const storage = multer.memoryStorage();

// Allow only image files
const fileFilter: multer.Options["fileFilter"] = (
  req,
  file,
  cb
) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid image type. Only JPG, PNG and WEBP are allowed."
      )
    );
  }
};

// Upload configuration
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB maximum
  },
  fileFilter,
});

export default upload;