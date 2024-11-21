const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define the movie schema
let movieSchema = mongoose.Schema({
	Title: {
		type: String,
		required: true,
		collation: { locale: 'en', strength: 2 }, // Case-insensitive indexing
	},
	Description: { type: String, required: true },
	Genre: {
		Name: {
			type: String,
			collation: { locale: 'en', strength: 2 }, // Case-insensitive indexing
		},
		Description: String,
	},
	Director: {
		Name: {
			type: String,
			collation: { locale: 'en', strength: 2 }, // Case-insensitive indexing
		},
		Bio: String,
		Birth: Date,
		Death: Date,
	},
	Actors: [String],
	ImagePath: String,
	Featured: Boolean,
});

// Define the user schema
let userSchema = mongoose.Schema({
	Username: {
		type: String,
		required: true,
		unique: true,
		collation: { locale: 'en', strength: 2 }, // Case-insensitive indexing
	},
	Password: { type: String, required: true },
	Email: {
		type: String,
		required: true,
		unique: true,
		collation: { locale: 'en', strength: 2 }, // Case-insensitive indexing
	},
	Birthday: Date,
	FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
});

// Add case-insensitive indexes explicitly
movieSchema.index({ Title: 1 }, { collation: { locale: 'en', strength: 2 } });
movieSchema.index({ 'Genre.Name': 1 }, { collation: { locale: 'en', strength: 2 } });
movieSchema.index({ 'Director.Name': 1 }, { collation: { locale: 'en', strength: 2 } });

userSchema.index({ Username: 1 }, { collation: { locale: 'en', strength: 2 } });
userSchema.index({ Email: 1 }, { collation: { locale: 'en', strength: 2 } });

// Add password hashing method
userSchema.statics.hashPassword = (password) => {
	return bcrypt.hashSync(password, 10);
};

// Add password validation method
userSchema.methods.validatePassword = function (password) {
	return bcrypt.compareSync(password, this.Password);
};

// Define models
let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);

module.exports.Movie = Movie;
module.exports.User = User;
