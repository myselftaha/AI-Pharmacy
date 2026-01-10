import React from 'react';
import clsx from 'clsx';

const CategoryFilter = ({ categories, activeCategory, onSelect }) => {
    return (
        <div className="flex flex-wrap gap-2 mb-2">
            {categories.map((category) => (
                <button
                    key={category}
                    onClick={() => onSelect(category)}
                    className={clsx(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                        activeCategory === category
                            ? "bg-green-100 text-green-700"
                            : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-100"
                    )}
                >
                    {category}
                </button>
            ))}
        </div>
    );
};

export default CategoryFilter;
