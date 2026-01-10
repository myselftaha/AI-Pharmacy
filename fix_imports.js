
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Schemas (Simplified for the script)
const medicineSchema = new mongoose.Schema({
    id: Number,
    name: String,
    stock: Number,
    costPrice: Number,
    expiryDate: Date,
    packSize: Number,
    mrp: Number,
    sellingPrice: Number,
    category: String,
    unit: String,
    netContent: String,
    supplier: String
});
const Medicine = mongoose.model('Medicine', medicineSchema);

const supplySchema = new mongoose.Schema({
    medicineId: String,
    name: String,
    batchNumber: String,
    supplierName: String,
    purchaseCost: Number,
    purchaseInvoiceNumber: String,
    expiryDate: Date,
    quantity: Number,
    packSize: Number,
    mrp: Number,
    sellingPrice: Number,
    category: String,
    unit: String,
    netContent: String,
    addedDate: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});
const Supply = mongoose.model('Supply', supplySchema);

const fixImports = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const medicines = await Medicine.find({});
        console.log(`Checking ${medicines.length} medicines...`);

        let fixedCount = 0;

        for (const med of medicines) {
            // Check if supply exists
            const supply = await Supply.findOne({
                $or: [
                    { medicineId: med.id.toString() },
                    { medicineId: med._id.toString() }
                ]
            });

            if (!supply) {
                console.log(`Fixing invisible medicine: ${med.name}`);

                const newSupply = new Supply({
                    medicineId: med.id.toString(),
                    name: med.name,
                    batchNumber: `FIX-${new Date().getTime()}`,
                    supplierName: med.supplier || 'Opening Stock',
                    purchaseCost: med.costPrice || 0,
                    purchaseInvoiceNumber: 'System Fix',
                    expiryDate: med.expiryDate,
                    quantity: med.stock || 0,
                    packSize: med.packSize || 1,
                    mrp: med.mrp || 0,
                    sellingPrice: med.sellingPrice || 0,
                    category: med.category || 'General',
                    unit: med.unit || 'Piece',
                    netContent: med.netContent || '',
                    addedDate: new Date()
                });

                await newSupply.save();
                fixedCount++;
            }
        }

        console.log(`\nOperation Complete! Fixed ${fixedCount} invisible items.`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixImports();
