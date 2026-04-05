import DeliveryZoneModel from "../models/deliveryZone.model.js";

export async function createDeliveryZone(request, response) {
    try {
        const { zoneName, pincodes, estimatedTime, deliveryCharge } = request.body;

        if (!zoneName) {
            return response.status(400).json({
                message: "Zone name is required",
                error: true,
                success: false,
            });
        }

        const zone = new DeliveryZoneModel({
            zoneName,
            pincodes: pincodes || [],
            estimatedTime: estimatedTime || "10-20 min",
            deliveryCharge: deliveryCharge || 0,
        });

        const saved = await zone.save();

        return response.json({
            message: "Delivery zone created",
            data: saved,
            error: false,
            success: true,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}

export async function getDeliveryZones(request, response) {
    try {
        const zones = await DeliveryZoneModel.find().sort({ createdAt: -1 });

        return response.json({
            message: "Delivery zones",
            data: zones,
            error: false,
            success: true,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}

export async function updateDeliveryZone(request, response) {
    try {
        const { _id, zoneName, pincodes, estimatedTime, deliveryCharge, isActive } = request.body;

        if (!_id) {
            return response.status(400).json({
                message: "Zone ID is required",
                error: true,
                success: false,
            });
        }

        const updateData = {};
        if (zoneName !== undefined) updateData.zoneName = zoneName;
        if (pincodes !== undefined) updateData.pincodes = pincodes;
        if (estimatedTime !== undefined) updateData.estimatedTime = estimatedTime;
        if (deliveryCharge !== undefined) updateData.deliveryCharge = deliveryCharge;
        if (isActive !== undefined) updateData.isActive = isActive;

        const updated = await DeliveryZoneModel.findByIdAndUpdate(_id, updateData, { new: true });

        if (!updated) {
            return response.status(404).json({
                message: "Delivery zone not found",
                error: true,
                success: false,
            });
        }

        return response.json({
            message: "Delivery zone updated",
            data: updated,
            error: false,
            success: true,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}

export async function deleteDeliveryZone(request, response) {
    try {
        const { _id } = request.body;

        if (!_id) {
            return response.status(400).json({
                message: "Zone ID is required",
                error: true,
                success: false,
            });
        }

        const deleted = await DeliveryZoneModel.findByIdAndDelete(_id);

        if (!deleted) {
            return response.status(404).json({
                message: "Delivery zone not found",
                error: true,
                success: false,
            });
        }

        return response.json({
            message: "Delivery zone deleted",
            data: null,
            error: false,
            success: true,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}

export async function checkPincode(request, response) {
    try {
        const { pincode } = request.body;

        if (!pincode) {
            return response.status(400).json({
                message: "Pincode is required",
                error: true,
                success: false,
            });
        }

        const zone = await DeliveryZoneModel.findOne({
            pincodes: pincode,
            isActive: true,
        });

        if (zone) {
            return response.json({
                message: "Delivery available",
                data: {
                    available: true,
                    zoneName: zone.zoneName,
                    estimatedTime: zone.estimatedTime,
                    deliveryCharge: zone.deliveryCharge,
                },
                error: false,
                success: true,
            });
        }

        return response.json({
            message: "Delivery not available for this pincode",
            data: {
                available: false,
                estimatedTime: null,
                deliveryCharge: null,
            },
            error: false,
            success: true,
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
}
