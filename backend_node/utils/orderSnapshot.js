/**
 * Shared helpers used while creating an order (both COD and Razorpay verify).
 *
 * Responsibility:
 *  - Build a complete `delivery_address_snapshot` object with no empty
 *    critical fields. We prefer the Razorpay Magic-Checkout popup address
 *    (since that's what the user actually confirmed), but fall back to the
 *    user's saved AddressModel doc, and finally to the User's profile
 *    name/mobile so `name`/`mobile` are never empty in the DB.
 *  - Resolve `deliveryCharge` consistently:
 *    1. use the Magic-Checkout computed shipping fee if present,
 *    2. else use the frontend-provided deliveryCharge if non-zero,
 *    3. else look up the saved pincode in active DeliveryZones,
 *    4. else use SettingModel `default_delivery_charge` (0 if not set).
 */

import AddressModel       from "../models/address.model.js"
import UserModel          from "../models/user.model.js"
import DeliveryZoneModel  from "../models/deliveryZone.model.js"
import SettingModel       from "../models/settings.model.js"

function normalizeCountry(c) {
    if (!c) return 'India'
    const lc = String(c).toLowerCase()
    if (lc === 'in' || lc === 'ind' || lc === 'india') return 'India'
    return c
}

function last10Digits(mobile) {
    return String(mobile || '').replace(/\D/g, '').slice(-10)
}

/**
 * @param {Object} opts
 * @param {Array|null}   opts.popupAddresses  Razorpay shipping-info addresses (may be null)
 * @param {String|null}  opts.addressId       Saved AddressModel _id (fallback)
 * @param {String}       opts.userId          Current user id (profile fallback for name)
 * @param {Number}       opts.bodyDeliveryCharge  `deliveryCharge` field from request body
 * @returns {{ snapshot: Object, deliveryCharge: Number }}
 */
export async function buildOrderAddressAndDelivery({ popupAddresses, addressId, userId, bodyDeliveryCharge = 0 }) {
    let snapshot = {}
    let resolvedDeliveryCharge = bodyDeliveryCharge || 0

    // 1. Prefer popup address (what the user actually confirmed in Razorpay)
    if (Array.isArray(popupAddresses) && popupAddresses.length > 0) {
        const pa = popupAddresses.find(a => a.isSelected) || popupAddresses[0]
        snapshot = {
            name:         pa.name || '',
            mobile:       last10Digits(pa.contact),
            address_line: [pa.line1, pa.line2].filter(Boolean).join(', '),
            city:         pa.city  || '',
            state:        pa.state || '',
            pincode:      String(pa.zipcode || ''),
            country:      normalizeCountry(pa.country),
            landmark:     pa.line2 || '',
        }
        if (pa._computedShippingRupees != null && resolvedDeliveryCharge === 0) {
            resolvedDeliveryCharge = pa._computedShippingRupees
        }
    }

    // 2. Fill missing critical fields from saved AddressModel
    let addrDoc = null
    if (addressId && (!snapshot.address_line || !snapshot.pincode)) {
        addrDoc = await AddressModel.findById(addressId).lean()
        if (addrDoc) {
            snapshot = {
                name:         snapshot.name         || addrDoc.name         || '',
                mobile:       snapshot.mobile       || last10Digits(addrDoc.mobile),
                address_line: snapshot.address_line || addrDoc.address_line || '',
                city:         snapshot.city         || addrDoc.city         || '',
                state:        snapshot.state        || addrDoc.state        || '',
                pincode:      snapshot.pincode      || String(addrDoc.pincode || ''),
                country:      normalizeCountry(snapshot.country || addrDoc.country),
                landmark:     snapshot.landmark     || addrDoc.landmark     || '',
            }
        }
    } else if (addressId && (!snapshot.name || !snapshot.mobile)) {
        // Popup had address_line but no name/mobile — still fill those from DB
        addrDoc = await AddressModel.findById(addressId).lean()
        if (addrDoc) {
            snapshot.name   = snapshot.name   || addrDoc.name   || ''
            snapshot.mobile = snapshot.mobile || last10Digits(addrDoc.mobile)
        }
    }

    // 3. Final fallback for name/mobile: user profile
    if ((!snapshot.name || !snapshot.mobile) && userId) {
        try {
            const user = await UserModel.findById(userId).lean()
            if (user) {
                snapshot.name   = snapshot.name   || user.name   || ''
                snapshot.mobile = snapshot.mobile || last10Digits(user.mobile)
            }
        } catch (_) { /* non-fatal */ }
    }

    // 4. Recompute deliveryCharge from zone if we still have 0 and a pincode exists
    if (resolvedDeliveryCharge === 0 && snapshot.pincode) {
        try {
            const zones = await DeliveryZoneModel.find({ isActive: true }).lean()
            const zone = zones.find(z => Array.isArray(z.pincodes) && z.pincodes.includes(snapshot.pincode))
            if (zone?.deliveryCharge) {
                resolvedDeliveryCharge = zone.deliveryCharge
            } else {
                // Optional site-wide default
                const setting = await SettingModel.findOne({ key: 'default_delivery_charge' }).lean()
                const fallback = Number(setting?.value)
                if (!Number.isNaN(fallback) && fallback > 0) resolvedDeliveryCharge = fallback
            }
        } catch (_) { /* non-fatal */ }
    }

    // Ensure country is always set (don't leave empty)
    if (!snapshot.country) snapshot.country = 'India'

    return { snapshot, deliveryCharge: resolvedDeliveryCharge }
}
