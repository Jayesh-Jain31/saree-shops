import mongoose from "mongoose";

const deliveryZoneSchema = new mongoose.Schema({
    zoneName: {
        type: String,
        required: true,
    },
    pincodes: {
        type: [String],
        default: [],
    },
    estimatedTime: {
        type: String,
        default: "10-20 min",
    },
    deliveryCharge: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

const DeliveryZoneModel = mongoose.model('deliveryZone', deliveryZoneSchema);

export default DeliveryZoneModel;
