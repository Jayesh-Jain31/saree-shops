import ProductModel from "../models/product.model.js";
import CategoryModel from "../models/category.model.js";
import SubCategoryModel from "../models/subCategory.model.js";

export const createProductController = async(request,response)=>{
    try {
        const { 
            name ,
            image ,
            category,
            subCategory,
            unit,
            stock,
            price,
            discount,
            description,
            more_details,
        } = request.body 

        if(!name || !image[0] || !category[0] || !subCategory[0] || !unit || !price || !description ){
            return response.status(400).json({
                message : "Enter required fields",
                error : true,
                success : false
            })
        }

        const product = new ProductModel({
            name ,
            image ,
            category,
            subCategory,
            unit,
            stock,
            price,
            discount,
            description,
            more_details,
        })
        const saveProduct = await product.save()

        return response.json({
            message : "Product Created Successfully",
            data : saveProduct,
            error : false,
            success : true
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export const getProductController = async(request,response)=>{
    try {
        
        let { page, limit, search } = request.body 

        if(!page){
            page = 1
        }

        if(!limit){
            limit = 10
        }

        const query = search ? {
            $text : {
                $search : search
            }
        } : {}

        const skip = (page - 1) * limit

        const [data,totalCount] = await Promise.all([
            ProductModel.find(query).sort({createdAt : -1 }).skip(skip).limit(limit).populate('category subCategory').lean(),
            ProductModel.countDocuments(query)
        ])

        return response.json({
            message : "Product data",
            error : false,
            success : true,
            totalCount : totalCount,
            totalNoPage : Math.ceil( totalCount / limit),
            data : data
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export const getProductByCategory = async(request,response)=>{
    try {
        const { id } = request.body 

        if(!id){
            return response.status(400).json({
                message : "provide category id",
                error : true,
                success : false
            })
        }

        const product = await ProductModel.find({ 
            category : { $in : id }
        }).limit(15)

        return response.json({
            message : "category product list",
            data : product,
            error : false,
            success : true
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export const getProductByCategoryAndSubCategory  = async(request,response)=>{
    try {
        const { categoryId,subCategoryId,page,limit } = request.body

        const isValidId = (id) => id && id !== 'undefined' && id !== 'null' && /^[a-f\d]{24}$/i.test(id)

        if(!isValidId(categoryId) || !isValidId(subCategoryId)){
            return response.status(200).json({
                message : 'Category not found',
                data : [],
                totalCount : 0,
                page : 1,
                limit : 10,
                success : true,
                error : false
            })
        }

        if(!page){
            page = 1
        }

        if(!limit){
            limit = 10
        }

        const query = {
            category : { $in :categoryId  },
            subCategory : { $in : subCategoryId }
        }

        const skip = (page - 1) * limit

        const [data,dataCount] = await Promise.all([
            ProductModel.find(query).sort({createdAt : -1 }).skip(skip).limit(limit).lean(),
            ProductModel.countDocuments(query)
        ])

        return response.json({
            message : "Product list",
            data : data,
            totalCount : dataCount,
            page : page,
            limit : limit,
            success : true,
            error : false
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export const getProductDetails = async(request,response)=>{
    try {
        const { productId } = request.body 

        const product = await ProductModel.findOne({ _id : productId })


        return response.json({
            message : "product details",
            data : product,
            error : false,
            success : true
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//update product
export const updateProductDetails = async(request,response)=>{
    try {
        const { _id } = request.body 

        if(!_id){
            return response.status(400).json({
                message : "provide product _id",
                error : true,
                success : false
            })
        }

        const { name, image, description, category, subCategory, unit, stock, price, discount, publish, variants, moreDetails } = request.body
        const allowedUpdates = {}
        if (name !== undefined) allowedUpdates.name = name
        if (image !== undefined) allowedUpdates.image = image
        if (description !== undefined) allowedUpdates.description = description
        if (category !== undefined) allowedUpdates.category = category
        if (subCategory !== undefined) allowedUpdates.subCategory = subCategory
        if (unit !== undefined) allowedUpdates.unit = unit
        if (stock !== undefined) allowedUpdates.stock = stock
        if (price !== undefined) allowedUpdates.price = price
        if (discount !== undefined) allowedUpdates.discount = discount
        if (publish !== undefined) allowedUpdates.publish = publish
        if (variants !== undefined) allowedUpdates.variants = variants
        if (moreDetails !== undefined) allowedUpdates.moreDetails = moreDetails
        const oldProduct = stock !== undefined ? await ProductModel.findById(_id).select('stock').lean() : null
        const updateProduct = await ProductModel.updateOne({ _id : _id }, allowedUpdates)

        if (oldProduct && stock > 0 && (oldProduct.stock === 0 || oldProduct.stock === null)) {
            try {
                const product = await ProductModel.findById(_id).select('name').lean()
                const { notifyBackInStockSubscribers } = await import('./marketing.controller.js')
                notifyBackInStockSubscribers(_id, product?.name || 'Product').catch(() => {})
            } catch {}
        }

        return response.json({
            message : "updated successfully",
            data : updateProduct,
            error : false,
            success : true
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//delete product
export const deleteProductDetails = async(request,response)=>{
    try {
        const { _id } = request.body 

        if(!_id){
            return response.status(400).json({
                message : "provide _id ",
                error : true,
                success : false
            })
        }

        const deleteProduct = await ProductModel.deleteOne({_id : _id })

        return response.json({
            message : "Delete successfully",
            error : false,
            success : true,
            data : deleteProduct
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//search product
export const searchProduct = async(request,response)=>{
    try {
        let { search, page , limit } = request.body 

        if(!page){
            page = 1
        }
        if(!limit){
            limit  = 10
        }

        const query = search ? {
            $text : {
                $search : search
            }
        } : {}

        const skip = ( page - 1) * limit

        const [data,dataCount] = await Promise.all([
            ProductModel.find(query).sort({ createdAt  : -1 }).skip(skip).limit(limit).populate('category subCategory').lean(),
            ProductModel.countDocuments(query)
        ])

        return response.json({
            message : "Product data",
            error : false,
            success : true,
            data : data,
            totalCount :dataCount,
            totalPage : Math.ceil(dataCount/limit),
            page : page,
            limit : limit 
        })


    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export const bulkImportProductController = async (request, response) => {
    try {
        const { products } = request.body
        if (!products || !Array.isArray(products) || products.length === 0) {
            return response.status(400).json({ message: 'No products provided', error: true, success: false })
        }
        if (products.length > 500) {
            return response.status(400).json({ message: 'Max 500 products per import', error: true, success: false })
        }

        const [allCategories, allSubCategories] = await Promise.all([
            CategoryModel.find({}, 'name _id').lean(),
            SubCategoryModel.find({}, 'name _id').lean()
        ])

        const catMap = {}
        allCategories.forEach(c => { catMap[c.name.toLowerCase().trim()] = c._id })
        const subCatMap = {}
        allSubCategories.forEach(s => { subCatMap[s.name.toLowerCase().trim()] = s._id })

        const succeeded = []
        const failed = []

        for (let i = 0; i < products.length; i++) {
            const row = products[i]
            const rowNum = i + 2
            try {
                if (!row.name || !row.price || !row.unit || !row.description) {
                    failed.push({ row: rowNum, name: row.name || '(empty)', reason: 'Missing required fields: name, price, unit, description' })
                    continue
                }
                const price = parseFloat(row.price)
                if (isNaN(price) || price <= 0) {
                    failed.push({ row: rowNum, name: row.name, reason: 'Invalid price' })
                    continue
                }
                const categoryIds = []
                if (row.category) {
                    row.category.split('|').map(n => n.trim().toLowerCase()).forEach(n => { if (catMap[n]) categoryIds.push(catMap[n]) })
                }
                const subCategoryIds = []
                if (row.subCategory) {
                    row.subCategory.split('|').map(n => n.trim().toLowerCase()).forEach(n => { if (subCatMap[n]) subCategoryIds.push(subCatMap[n]) })
                }
                const images = row.image ? row.image.split('|').map(u => u.trim()).filter(Boolean) : []

                const product = await ProductModel.create({
                    name: row.name.trim(),
                    price,
                    discount: row.discount ? parseFloat(row.discount) || 0 : 0,
                    stock: row.stock ? parseInt(row.stock) || null : null,
                    unit: row.unit.trim(),
                    description: row.description.trim(),
                    category: categoryIds,
                    subCategory: subCategoryIds,
                    image: images,
                    publish: row.publish === 'false' ? false : true,
                })
                succeeded.push({ row: rowNum, name: row.name, id: product._id })
            } catch (err) {
                failed.push({ row: rowNum, name: row.name || '(empty)', reason: err.message })
            }
        }

        return response.json({
            message: `Import complete: ${succeeded.length} created, ${failed.length} failed`,
            data: { succeeded: succeeded.length, failed: failed.length, failedRows: failed },
            error: false,
            success: true
        })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

export const getRecommendations = async (req, res) => {
    try {
        const { productId } = req.params
        const limit = parseInt(req.query.limit) || 8

        const product = await ProductModel.findById(productId).select('category subCategory').lean()
        if (!product) return res.status(404).json({ message: 'Product not found', error: true, success: false })

        const categoryIds = product.category || []
        const subCategoryIds = product.subCategory || []

        let products = []
        if (subCategoryIds.length) {
            products = await ProductModel.find({
                _id: { $ne: productId },
                publish: true,
                stock: { $gt: 0 },
                subCategory: { $in: subCategoryIds }
            }).select('name image price discount category subCategory avgRating reviewCount stock').sort({ avgRating: -1, reviewCount: -1 }).limit(limit).lean()
        }

        if (products.length < limit && categoryIds.length) {
            const existingIds = products.map(p => p._id)
            const more = await ProductModel.find({
                _id: { $ne: productId, $nin: existingIds },
                publish: true,
                stock: { $gt: 0 },
                category: { $in: categoryIds }
            }).select('name image price discount category subCategory avgRating reviewCount stock').sort({ avgRating: -1 }).limit(limit - products.length).lean()
            products = [...products, ...more]
        }

        return res.json({ data: products, error: false, success: true })
    } catch (e) {
        return res.status(500).json({ message: e.message, error: true, success: false })
    }
}
