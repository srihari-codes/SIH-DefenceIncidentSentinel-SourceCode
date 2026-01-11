import mongoose, { Document, Schema } from 'mongoose';

export interface FileScannerDocument extends Document {
  attack_type: string;
}

const collectionName = process.env.MONGODB_FILES_SCANNER_TABLE || 'filescanner_microservice_table';

const FileScannerSchema = new Schema<FileScannerDocument>(
  {
    attack_type: { type: String, required: true, trim: true }
  },
  {
    collection: collectionName,
    strict: false
  }
);

const FileScannerModel =
  (mongoose.models && (mongoose.models as any).FileScanner) ||
  mongoose.model<FileScannerDocument>('FileScanner', FileScannerSchema);

export default FileScannerModel;
