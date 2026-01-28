import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  seq: { type: Number, default: 0 },
});

export default mongoose.models.Counter ||
  mongoose.model("Counter", counterSchema);
