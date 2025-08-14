import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.GOOGLE_PROJECT_ID,
});
const bucket = storage.bucket(process.env.GCLOUD_BUCKET_NAME);
export const uploadFile = async (req, res) => {
  try {
    const file = req.file;
    const path = req.body.path;
    if (!file) {
      return res
        .status(400)
        .json({ message: 'No se proporcionó ningún archivo' });
    }
    const gcsName = `CSComex/${path}/${uuidv4()}_${req.file.originalname}`;
    const bucketFile = bucket.file(gcsName);
    const stream = bucketFile.createWriteStream();
    stream.on('finish', async () => {
      try {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${gcsName}`;

        res.json({
          name: req.file.originalname,
          url: publicUrl,
          _id: gcsName,
          type: req.file.mimetype,
        });
      } catch (err) {
        console.error('Error publicando en GCS:', err);
        res
          .status(500)
          .json({ message: 'Error al subir el archivo: ' + err.message });
      }
    });
    stream.end(file.buffer);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error al subir el archivo: ' + error.message });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const key = req.params.key;
    const file = bucket.file(key);

    const [exists] = await file.exists();
    if (!exists) {
      return res
        .status(404)
        .json({ message: 'Archivo no encontrado en bucket.' });
    }

    await file.delete();
    res.status(200).json({ message: 'Archivo borrado exitosamente' });
  } catch (err) {
    console.error('Error borrando en GCS:', err);
    res
      .status(500)
      .json({ message: 'Error al borrar el archivo: ' + err.message });
  }
};
