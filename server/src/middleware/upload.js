// src/middleware/upload.js
const multer = require('multer');

const storage = multer.memoryStorage(); // keep files in memory for Supabase Storage upload

function fileFilter(allowedMimes) {
  return (req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        Object.assign(new Error(`Invalid file type. Allowed: ${allowedMimes.join(', ')}`), {
          status: 400,
        }),
        false
      );
    }
  };
}

/** CV upload — PDF only, max 5 MB */
const cvUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(['application/pdf']),
}).single('cv');

/** Logo upload — PNG/JPG, max 2 MB */
const logoUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: fileFilter(['image/png', 'image/jpeg']),
}).single('logo');

/** Wrap multer so errors are forwarded to Express error handler */
function wrapMulter(multerMiddleware) {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File too large' : err.message;
        return res.status(400).json({ error: 'Upload Error', message: msg });
      }
      if (err) return next(err);
      next();
    });
  };
}

module.exports = {
  uploadCV: wrapMulter(cvUpload),
  uploadLogo: wrapMulter(logoUpload),
};