import multer from 'multer';

const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_PROFILE_PHOTO_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      cb(new Error('Only JPG, PNG, or WEBP images are allowed'));
      return;
    }

    cb(null, true);
  },
});

export const uploadProfilePhoto = (req, res, next) => {
  uploader.single('photo')(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ message: 'Profile photo must be 5MB or smaller' });
        return;
      }

      res.status(400).json({ message: 'Invalid profile photo upload' });
      return;
    }

    res.status(400).json({ message: err.message || 'Invalid profile photo upload' });
  });
};

export const uploadRules = {
  maxProfilePhotoBytes: MAX_PROFILE_PHOTO_BYTES,
  allowedImageTypes: [...ALLOWED_IMAGE_TYPES],
};
