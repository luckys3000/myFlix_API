const express = require('express'),
	morgan = require('morgan'),
	bodyParser = require('body-parser'),
	uuid = require('uuid');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongoose = require('mongoose');
const Models = require('./models.js');

const userPublicAttributes = 'Username Email Birthday FavoriteMovies _id';

const { check, validationResult } = require('express-validator');

const Movies = Models.Movie;
const Users = Models.User;

app.use(bodyParser.json());

const cors = require('cors');
app.use(cors());

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

//Morgan invoked specifying requests logged using "common" format
app.use(morgan('common'));

//Express.static to serve documentation file from public folder
app.use(express.static('public'));

//mongoose.connect('mongodb://localhost:27017/cfDB');
mongoose.connect(process.env.CONNECTION_URI || 'mongodb://localhost:27017/cfDB');

/**
 * Return a list of all movies to the user.
 *
 * @route GET /movies
 * @returns {object[]} List of movies
 */
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Movies.find()
		.then((movies) => {
			res.status(201).json(movies);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

/**
 * Return data about a single movie by title to the user.
 *
 * @route Get /movies/:title
 * @param {string} req.params.title - The title of the movie to retrieve
 * @returns {object} Information about the movie
 */
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), async (req, res) => {
	try {
		const title = req.params.title; // Take the input parameter as-is
		const movie = await Movies.findOne({ Title: new RegExp(`^${title}$`, 'i') }); // Case-insensitive search
		if (!movie) {
			return res.status(404).send('Movie not found.');
		}

		// Return the movie as stored in the database
		res.json(movie);
	} catch (err) {
		console.error(err);
		res.status(500).send('Error: ' + err);
	}
});

/**
 * Return data about a genre by name/title.
 *
 * @route GET /movies/genres/:name
 * @param {string} req.params.name - The name of the genre to retrieve.
 * @returns {object} Information about the genre.
 */
app.get('/movies/genres/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
	const genreName = req.params.name;
	try {
		const movie = await Movies.findOne({ 'Genre.Name': new RegExp(`^${genreName}$`, 'i') });

		if (movie) {
			res.json(movie.Genre);
		} else {
			res.status(404).send('Genre not found');
		}
	} catch (err) {
		console.error(err);
		res.status(500).send('Error: ' + err);
	}
});

/**
 * Return data about a director by name.
 *
 * @route GET /directors/:name
 * @param {string} req.params.name - The name of the director to retrieve.
 * @returns {object} Information about the director.
 */
app.get('/movies/directors/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
	const directorName = req.params.name;

	try {
		const movie = await Movies.findOne({ 'Director.Name': new RegExp(`^${directorName}$`, 'i') });

		if (movie) {
			res.json(movie.Director);
		} else {
			res.status(404).send('Director not found');
		}
	} catch (err) {
		console.error(err);
		res.status(500).send('Error: ' + err);
	}
});

/**
 * Retrieve a list of all users.
 *
 * @route GET /users
 * @return {object[]} List of users
 */
app.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Users.find({}, userPublicAttributes)
		.then((users) => {
			res.status(201).json(users);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

/**
 * Retrieves information about a specific user by their username.
 *
 * @route GET /users/:username
 * @param {string} req.params.username - The username to retrieve.
 * @returns {object} Information about the user.
 */
app.get('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
	const username = req.params.username; // Extract the username from the route parameter
	try {
		// Perform a case-insensitive query for Username
		const user = await Users.findOne({ Username: new RegExp(`^${username}$`, 'i') }, userPublicAttributes);

		if (user) {
			res.json(user); // Return the user data as stored in the database
		} else {
			res.status(404).send('User not found');
		}
	} catch (err) {
		console.error(err);
		res.status(500).send('Error: ' + err);
	}
});

/**
 * Allow new users to register.
 *
 * @route POST /users
 * @param {object} req.body - The data of the new user to be created.
 * @param {string} req.body.username - The username of the new user.
 * @returns {object} The newly created user.
 */
app.post(
	'/users',
	// Validation logic here for request
	[
		check('Username', 'Username is required').not().isEmpty(),
		check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
		check('Password', 'Password is required').not().isEmpty(),
		check('Password', 'Password requires a minimum of 8 characters').isLength({ min: 8 }),
		check('Email', 'Email does not appear to be valid').isEmail(),
	],
	async (req, res) => {
		try {
			// check the validation object for errors
			let errors = validationResult(req);

			if (!errors.isEmpty()) {
				return res.status(422).json({ errors: errors.array() });
			}

			const newUser = req.body;

			let hashedPassword = Users.hashPassword(newUser.Password);

			let user = await Users.findOne({ Username: new RegExp(`^${newUser.Username}$`, 'i') });

			if (user) {
				return res.status(400).send({ error: `${newUser.Username} already exists` });
			}

			user = await Users.create({
				Email: newUser.Email,
				Username: newUser.Username,
				Password: hashedPassword,
				Birthday: newUser.Birthday,
			});

			return res.status(201).json({
				Email: user.Email,
				Username: user.Username,
				Birthday: user.Birthday,
				_id: user._id,
				FavoriteMovies: user.FavoriteMovies,
			});
		} catch (error) {
			console.error(error);

			if (error.Name === 'ValidationError') {
				const message = Object.values(error.errors).map((value) => value.message);
				return res.status(400).json({
					error: message,
				});
			}

			return res.status(500).json({ error: error.message });
		}
	}
);

/**
 * Allow users to update their user info (username, password, email, date of birth).
 *
 * @route PUT /users/:username
 * @param {string} req.params.username - The Username of the user to be updated.
 * @param {string} req.body.email - The new email for the user.
 * @param {string} req.body.password - The updated password for the user.
 * @param {date} req.body.birthday - The updated birthday for the user.
 * @returns {object} The updated user information.
 */
app.put(
	'/users/:username',
	[check('Username', 'Username is required').not().isEmpty(), check('Password', 'Password is required').not().isEmpty()],
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		// Check if the logged-in user's username matches the requested username
		if (req.user.Username.toLowerCase() !== req.params.username.toLowerCase()) {
			return res.status(400).send('Permission denied');
		}

		try {
			// Case-insensitive query for the username
			const filter = { Username: new RegExp(`^${req.params.username}$`, 'i') };
			const options = { new: true }; // Return the updated document
			let update = {};

			// Update fields if provided in the request body
			if (req.body.Email) {
				update['Email'] = req.body.Email;
			}

			if (req.body.Password) {
				const hashedPassword = Users.hashPassword(req.body.Password);
				update['Password'] = hashedPassword;
			}

			if (req.body.Birthday) {
				update['Birthday'] = req.body.Birthday;
			}

			// Perform the update
			const user = await Users.findOneAndUpdate(filter, update, options);

			if (!user) {
				return res.status(400).send({ error: `${req.params.username} was not found` });
			}

			// Return the updated user data
			return res.status(200).json({
				Email: user.Email,
				Username: user.Username,
				Birthday: user.Birthday,
			});
		} catch (error) {
			console.error(error);

			return res.status(500).json({ error: error.message });
		}
	}
);

/**
 * Allow users to add a movie to their list of favorites.
 *
 * @route POST /users/:username/movies/:movieId/favorite
 * @param {string} req.params.username - The username of the user.
 * @param {string} req.params.movieId - The id of the movie to be added.
 * @returns {object} The updated user information.
 */
app.post('/users/:username/movies/:movieId/favorite', passport.authenticate('jwt', { session: false }), async (req, res) => {
	// Check if the logged-in user's username matches the requested username
	if (req.user.Username.toLowerCase() !== req.params.username.toLowerCase()) {
		return res.status(400).send('Permission denied');
	}
	// CONDITION ENDS
	try {
		//Case-insensitive query for the username
		const filter = { Username: new RegExp(`^${req.params.username}$`, 'i') };
		const options = { new: true };
		const update = { $push: { FavoriteMovies: req.params.movieId } };

		const user = await Users.findOneAndUpdate(filter, update, options);

		if (!user) {
			return res.status(400).send({ error: `${req.params.username} was not found` });
		}

		return res.status(200).json({
			Email: user.Email,
			Username: user.Username,
			Birthday: user.Birthday,
			FavoriteMovies: user.FavoriteMovies,
		});
	} catch (error) {
		console.error(error);

		return res.status(500).json({ error: error.message });
	}
});

/**
 * Allow users to remove a movie to their list of favorites.
 *
 * @route DELETE /users/:username/movies/:movieId/favorite
 * @param {string} req.params.username - The username of the user.
 * @param {string} req.params.movieId - The id of the movie to be removed.
 * @returns {object} The updated user information.
 */
app.delete('/users/:username/movies/:movieId/favorite', passport.authenticate('jwt', { session: false }), async (req, res) => {
	// Check if the logged-in user's username matches the requested username
	if (req.user.Username.toLowerCase() !== req.params.username.toLowerCase()) {
		return res.status(400).send('Permission denied');
	}
	// CONDITION ENDS

	try {
		//Case-insensitive query for the username
		const filter = { Username: new RegExp(`^${req.params.username}$`, 'i') };
		const options = { new: true };
		const update = { $pull: { FavoriteMovies: req.params.movieId } };

		const user = await Users.findOneAndUpdate(filter, update, options);

		if (!user) {
			return res.status(400).send({ error: `${req.params.username} was not found` });
		}

		return res.status(200).json({
			Email: user.Email,
			Username: user.Username,
			Birthday: user.Birthday,
			FavoriteMovies: user.FavoriteMovies,
		});
	} catch (error) {
		console.error(error);

		return res.status(500).json({ error: error.message });
	}
});

/**
 * Allow existing users to deregister.
 *
 * @route DELETE /users/:username
 * @param {string} req.params.username - The username of the user to be deleted.
 * @returns {string} Message indicating the user has been deleted.
 */
app.delete('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
	// Check if the logged-in user's username matches the requested username
	if (req.user.Username.toLowerCase() !== req.params.username.toLowerCase()) {
		return res.status(400).send('Permission denied');
	}
	// CONDITION ENDS

	try {
		const { username } = req.params;

		// Case-insensitive query using collation
		const user = await Users.findOneAndDelete({ Username: username }, { collation: { locale: 'en', strength: 2 } });

		if (!user) {
			return res.status(404).send({ error: `${username} was not found` });
		}

		return res.status(200).send({ message: `User ${username} has been deleted` });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: error.message });
	}
});

app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send('Something broke!');
});

//listen for requests
const port = process.env.PORT || 8080;
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
