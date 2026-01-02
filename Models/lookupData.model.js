import mongoose from 'mongoose';

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters'],
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
categorySchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
  }
  next();
});
const Category = mongoose.model('Category', categorySchema);

// SubCategory Schema and Model======================================================================================
const subCategorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'SubCategory name is required'],
      trim: true,
      minlength: [2, 'SubCategory name must be at least 2 characters'],
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'SubCategory must belong to a category'],
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
subCategorySchema.index({ name: 1, category: 1 }, { unique: true });
subCategorySchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
  }
  next();
});
const SubCategory = mongoose.model('SubCategory', subCategorySchema);


// Country Schema and Model===========================================================================================
const countrySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    iso2: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    iso3: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    phone_code: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);
const Country = mongoose.model('Country', countrySchema);

// State Schema and Model==============================================================================================
const stateSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Country',
      required: true,
    },
    iso2: {
      type: String,
      trim: true,
      uppercase: true,
    },
  },
  {
    timestamps: true,
  }
);
stateSchema.index({ name: 1, country: 1 }, { unique: true });
const State = mongoose.model('State', stateSchema);


// City Schema and Model=================================================================================================
const citySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'State',
      required: true,
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Country',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
citySchema.index({ name: 1, state: 1 }, { unique: true });
const City = mongoose.model('City', citySchema);

export { Category, SubCategory, Country, State, City };