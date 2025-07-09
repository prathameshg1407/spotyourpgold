
import mongoose from "mongoose";

const adSchema = new mongoose.Schema({
        title: { type: String, required: true },
});

const Ad = mongoose.models.Ad || mongoose.model("Ad", adSchema);
export default Ad;
