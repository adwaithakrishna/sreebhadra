const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');
const { HttpError } = require('../lib/errors');

const uploadRoot = path.resolve(__dirname, '../../', config.storage.uploadDir);

/** Identify the real image type from magic bytes (never trust the client's mimetype). */
function sniffImageType(buf) {
  if (buf.length > 12) {
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' };
    if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: 'png', mime: 'image/png' };
    if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return { ext: 'webp', mime: 'image/webp' };
  }
  return null;
}

let cloudinary;
function getCloudinary() {
  if (!cloudinary) {
    const c = config.storage.cloudinary;
    if (!c.cloud_name || !c.api_key || !c.api_secret)
      throw new HttpError(500, 'Cloudinary storage selected but CLOUDINARY_* variables are not set.');
    cloudinary = require('cloudinary').v2;
    cloudinary.config({ ...c, secure: true });
  }
  return cloudinary;
}

/** Store an image buffer. Returns { url, storageKey, storageDriver }. */
async function saveImage(buffer) {
  const type = sniffImageType(buffer);
  if (!type) throw new HttpError(422, 'Only JPEG, PNG or WebP images are accepted.');

  if (config.storage.driver === 'cloudinary') {
    const cld = getCloudinary();
    const result = await new Promise((resolve, reject) => {
      cld.uploader
        .upload_stream({ folder: 'wayfarer/vehicles', resource_type: 'image' }, (err, res) => (err ? reject(err) : resolve(res)))
        .end(buffer);
    });
    return { url: result.secure_url, storageKey: result.public_id, storageDriver: 'cloudinary' };
  }

  await fs.mkdir(uploadRoot, { recursive: true });
  const filename = `${crypto.randomBytes(16).toString('hex')}.${type.ext}`;
  await fs.writeFile(path.join(uploadRoot, filename), buffer);
  return { url: `${config.storage.publicBaseUrl}/uploads/${filename}`, storageKey: filename, storageDriver: 'local' };
}

async function deleteImage({ storageKey, storageDriver }) {
  try {
    if (storageDriver === 'cloudinary') await getCloudinary().uploader.destroy(storageKey);
    else if (/^[a-f0-9]{32}\.(jpg|png|webp)$/.test(storageKey)) await fs.unlink(path.join(uploadRoot, storageKey));
  } catch (err) {
    console.warn('Could not delete stored image', storageKey, err.message); // DB record still removed
  }
}

module.exports = { saveImage, deleteImage, sniffImageType, uploadRoot };
