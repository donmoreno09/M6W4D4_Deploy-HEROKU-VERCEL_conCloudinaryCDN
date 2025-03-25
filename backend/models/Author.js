import mongoose from 'mongoose';

const authorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    birthDate: {
      type: Date,
      min: '1900-01-01',
      max: Date.now, // data odierna come data massima
  },
  profile: String,
  },
  { timestamps: true }
);

const Author = mongoose.model('Author', authorSchema);
export default Author;