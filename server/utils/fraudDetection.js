import OrderModel from '../models/order.model.js'
import UserModel from '../models/user.model.js'

export function getRiskLevel(score) {
    if (score >= 80) return 'critical'
    if (score >= 60) return 'high'
    if (score >= 30) return 'medium'
    return 'low'
}

/**
 * Assess fraud risk for a COD order before it is saved.
 * Returns { riskScore, riskLevel, reasons, shouldBlock }
 */
export async function assessOrderRisk({ userId, totalAmt, items }) {
    const reasons = []
    let score = 0

    const [user, userOrders] = await Promise.all([
        UserModel.findById(userId),
        OrderModel.find({ userId }).sort({ createdAt: -1 })
    ])

    if (!user) return { riskScore: 100, riskLevel: 'critical', reasons: ['User not found'], shouldBlock: true }

    const accountAgeDays = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)

    // Rule 1: Very new account placing COD order
    if (accountAgeDays < 1) {
        score += 40
        reasons.push('Account created less than 24 hours ago')
    } else if (accountAgeDays < 7) {
        score += 20
        reasons.push(`New account (${Math.floor(accountAgeDays)} days old)`)
    }

    // Rule 2: High-value COD order from new/first-time buyer
    const completedOrders = userOrders.filter(o => o.orderStatus === 'Delivered')
    if (totalAmt > 3000 && completedOrders.length === 0) {
        score += 35
        reasons.push(`High-value COD (₹${totalAmt}) with no delivery history`)
    } else if (totalAmt > 5000) {
        score += 20
        reasons.push(`Very high-value COD order (₹${totalAmt})`)
    }

    // Rule 3: History of cancelled COD orders
    const cancelledCOD = userOrders.filter(
        o => o.orderStatus === 'Cancelled' && o.payment_status?.toUpperCase() === 'CASH ON DELIVERY'
    )
    if (cancelledCOD.length >= 3) {
        score += 40
        reasons.push(`${cancelledCOD.length} previously cancelled COD orders`)
    } else if (cancelledCOD.length >= 1) {
        score += cancelledCOD.length * 15
        reasons.push(`${cancelledCOD.length} cancelled COD order(s) in history`)
    }

    // Rule 4: Too many orders in last 24 hours
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentOrders = userOrders.filter(o => new Date(o.createdAt) > last24h)
    if (recentOrders.length >= 4) {
        score += 30
        reasons.push(`${recentOrders.length} orders placed in last 24 hours`)
    } else if (recentOrders.length >= 2) {
        score += 10
        reasons.push(`${recentOrders.length} orders placed in last 24 hours`)
    }

    // Rule 5: Duplicate mobile number across multiple accounts
    if (user.mobile) {
        const samePhone = await UserModel.countDocuments({ mobile: user.mobile, _id: { $ne: userId } })
        if (samePhone >= 2) {
            score += 50
            reasons.push(`Mobile number shared with ${samePhone} other account(s)`)
        } else if (samePhone === 1) {
            score += 25
            reasons.push('Mobile number used on another account')
        }
    }

    // Rule 6: Never completed any order ever
    if (userOrders.length > 0 && completedOrders.length === 0) {
        score += 15
        reasons.push('No successfully delivered orders on record')
    }

    const riskLevel = getRiskLevel(score)
    return {
        riskScore: Math.min(score, 100),
        riskLevel,
        reasons,
        shouldBlock: score >= 80
    }
}

/**
 * Assess fraud risk for an existing user account.
 * Used for user-level spam detection.
 */
export async function assessUserRisk(userId) {
    const reasons = []
    let score = 0

    const [user, orders] = await Promise.all([
        UserModel.findById(userId),
        OrderModel.find({ userId })
    ])

    if (!user) return { riskScore: 0, riskLevel: 'low', reasons: [] }

    const accountAgeDays = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    const totalOrders = orders.length
    const cancelledOrders = orders.filter(o => o.orderStatus === 'Cancelled').length
    const deliveredOrders = orders.filter(o => o.orderStatus === 'Delivered').length
    const codOrders = orders.filter(o => o.payment_status?.toUpperCase() === 'CASH ON DELIVERY')
    const cancelledCOD = codOrders.filter(o => o.orderStatus === 'Cancelled').length

    // Rule 1: High cancellation rate
    if (totalOrders >= 3 && cancelledOrders / totalOrders > 0.7) {
        score += 35
        reasons.push(`High cancellation rate: ${cancelledOrders}/${totalOrders} orders cancelled`)
    }

    // Rule 2: Many COD cancellations
    if (cancelledCOD >= 3) {
        score += 30
        reasons.push(`${cancelledCOD} cancelled COD orders`)
    }

    // Rule 3: Shared mobile number
    if (user.mobile) {
        const samePhone = await UserModel.countDocuments({ mobile: user.mobile, _id: { $ne: userId } })
        if (samePhone >= 1) {
            score += 40
            reasons.push(`Phone number linked to ${samePhone + 1} accounts`)
        }
    }

    // Rule 4: Account is very new with many orders
    if (accountAgeDays < 3 && totalOrders >= 3) {
        score += 30
        reasons.push(`${totalOrders} orders within ${Math.floor(accountAgeDays)} days of signup`)
    }

    // Rule 5: Zero delivery success with multiple orders
    if (totalOrders >= 4 && deliveredOrders === 0) {
        score += 20
        reasons.push('No successful deliveries across multiple orders')
    }

    const riskLevel = getRiskLevel(score)
    return {
        riskScore: Math.min(score, 100),
        riskLevel,
        reasons
    }
}
