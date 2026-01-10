export const medicines = [
    {
        id: 1,
        name: 'Adhesive Bandages',
        description: 'Flexible bandages for cuts and scrapes.',
        price: 3.00,
        stock: 71,
        unit: 'Box',
        netContent: '50 assorted',
        category: 'First Aid',
        image: 'https://placehold.co/100x100?text=Bandages'
    },
    {
        id: 2,
        name: 'Allergy Relief Tabs',
        description: 'Non-drowsy relief from allergy symptoms like sneezing...',
        price: 8.99,
        stock: 26,
        unit: 'Box',
        netContent: '20 tablets',
        category: 'Antihistamines',
        image: 'https://placehold.co/100x100?text=Allergy'
    },
    {
        id: 3,
        name: 'Amoxicillin 250mg',
        description: 'Antibiotic for bacterial infections (prescription required).',
        price: 12.00,
        stock: 19,
        unit: 'Strip',
        netContent: '10 capsules',
        category: 'Antibiotics',
        image: 'https://placehold.co/100x100?text=Amoxicillin'
    },
    {
        id: 4,
        name: 'Cefalaxin',
        description: 'Best for infections',
        price: 13.00,
        stock: 94,
        unit: 'Box',
        netContent: '15',
        category: 'Antibiotics',
        image: 'https://placehold.co/100x100?text=Cefalaxin'
    },
    {
        id: 5,
        name: 'Cough Suppressant',
        description: 'Relieves dry and irritating coughs.',
        price: 6.20,
        stock: 37,
        unit: 'Bottle',
        netContent: '100ml',
        category: 'Pain Relief', // Assuming category
        image: 'https://placehold.co/100x100?text=Cough'
    },
    {
        id: 6,
        name: 'Vitamin C 1000mg',
        description: 'Immune system support.',
        price: 9.50,
        stock: 45,
        unit: 'Bottle',
        netContent: '60 tablets',
        category: 'Vitamins',
        image: 'https://placehold.co/100x100?text=Vitamin+C'
    }
];

export const categories = [
    'All',
    'Antibiotics',
    'Antihistamines',
    'First Aid',
    'Pain Relief',
    'Skincare',
    'Vitamins'
];

export const waitlist = [
    {
        id: 2,
        name: 'Customer2',
        itemsCount: 8,
        notes: 'For himself. Not well at all',
        status: 'Waiting',
        addedTime: '03:11 PM',
        queueNumber: 2
    }
];

export const salesHistory = [
    { id: '#15', date: 'Jun 10, 2025 18:09', amount: 32.00, method: 'Cash', customer: 'Walk-in', processedBy: 'Santosh' },
    { id: '#14', date: 'Jun 10, 2025 18:06', amount: 16.00, method: 'Card', customer: 'Walk-in', processedBy: 'Santosh' },
    { id: '#13', date: 'Jun 10, 2025 16:40', amount: 12.00, method: 'Cash', customer: 'Walk-in', processedBy: 'Santosh' },
];

export const users = [
    { name: 'Santosh', username: 'Santosh', email: 'Santosh@gmail.com', role: 'Admin' },
    { name: 'userpharma', username: 'userpharma', email: 'user@gmail.com', role: 'Pharmacist' },
];
