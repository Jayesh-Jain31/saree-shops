export const pricewithDiscount = (price, dis = 1) => {
    const numPrice = Number(price);
    const numDis = Number(dis);
    if (!numPrice || numPrice <= 0) return 0;
    const discountAmount = Math.ceil((numPrice * numDis) / 100);
    const actualPrice = numPrice - discountAmount;
    return actualPrice;
}
