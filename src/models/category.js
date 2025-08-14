import mongoose from "mongoose";
const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: {
      type: Schema.Types.String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: Schema.Types.String,
    },
    isActive: {
      type: Schema.Types.Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Category = mongoose.model("Category", categorySchema);
