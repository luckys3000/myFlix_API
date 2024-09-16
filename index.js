const express = require('express'),
	morgan = require('morgan'),
	bodyParser = require('body-parser'),
	uuid = require('uuid');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongoose = require('mongoose');
const Models = require('./models.js');

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

mongoose.connect('mongodb://localhost:27017/cfDB');

/**
 * Return welcome message on index page.
 *
 * @route GET /
 * @returns {string} Welcome message returned to user
 */
app.get('/', (req, res) => {
	res.send('Welcome to myFlix API!');
});

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
	await Movies.findOne({ Title: req.params.title })
		.then((movie) => {
			res.json(movie);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

/**
 * Return data about a genre by name/title.
 *
 * @route GET /genres/:name
 * @param {string} req.params.name - The name of the genre to retrieve.
 * @returns {object} Information about the genre.
 */
app.get('/movies/genres/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
	const genreName = req.params.name;
	try {
		const movie = await Movies.findOne({ 'Genre.Name': genreName });

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
 * @returns {object} Informatoin about the director.
 */
app.get('/movies/directors/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
	const directorName = req.params.name;

	try {
		const movie = await Movies.findOne({ 'Director.Name': directorName });

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
	await Users.find()
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
 * @route GET /users/:Username
 * @param {string} req.params.Username - The email of the user to retrieve.
 * @returns {object} Information about the user.
 */
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
	await Users.findOne({ Username: req.params.Username })
		.then((user) => {
			res.json(user);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

/**
 * Allow new users to register.
 *
 * @route POST /users
 * @param {object} req.body - The data of the new user to be created.
 * @param {string} req.body.Username - The email of the new user.
 * @returns {object} The newly created user.
 */
app.post('/users', async (req, res) => {
	let hashedPassword = Users.hashedPassword(req.body.Password);

	try {
		const newUser = req.body;

		let user = await Users.findOne({ Username: newUser.Username });

		if (user) {
			return res.status(400).send({ error: `${newUser.Username} already exists` });
		}

		user = await Users.create({
			Email: newUser.Email,
			Username: newUser.Username,
			Password: newUser.Password,
			Birthday: newUser.Birthday,
		});

		return res.status(201).json({
			Email: user.Email,
			Username: user.Username,
			Birthday: user.Birthday,
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
});

/**
 * Allow users to update their user info (username, password, email, date of birth).
 *
 * @route PUT /users/:username
 * @param {string} req.params.Username - The Username of the user to be updated.
 * @param {string} req.body.Email - The new email for the user.
 * @param {string} req.body.Password - The updated password for the user.
 * @param {date} req.body.Birthday - The updated birthday for the user.
 * @returns {object} The updated user information.
 */
app.put('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
	//Condition to check for Username
	if (req.user.Username !== req.params.Username) {
		return res.status(400).send('Permission denied');
	}
	// Condition ends
	try {
		const filter = { Username: req.params.Username };
		const options = { new: true };
		let update = {};

		// update email if exists
		if (req.body.Email) {
			update['Email'] = req.body.Email;
		}

		// update password if exists
		if (req.body.Password) {
			update['Password'] = req.body.Password;
		}

		// update birthday if exists
		if (req.body.Birthday) {
			update['Birthday'] = req.body.Birthday;
		}

		const user = await Users.findOneAndUpdate(filter, update, options);

		if (!user) {
			return res.status(400).send({ error: `${req.params.Username} was not found` });
		}

		return res.status(200).json({
			Email: user.Email,
			Username: user.Username,
			Birthday: user.Birthday,
		});
	} catch (error) {
		console.error(error);

		return res.status(500).json({ error: error.message });
	}
});

/**
 * Allow users to add a movie to their list of favorites.
 *
 * @route POST /users/:username/movies/:movieId/favorite
 * @param {string} req.params.Username - The username of the user.
 * @param {string} req.params.movieId - The id of the movie to be added.
 * @returns {object} The updated user information.
 */
app.post('/users/:username/movies/:movieId/favorite', passport.authenticate('jwt', { session: false }), async (req, res) => {
	// CONDITION TO CHECK ADDED HERE
	if (req.user.Username !== req.params.Username) {
		return res.status(400).send('Permission denied');
	}
	// CONDITION ENDS
	try {
		const filter = { Username: req.params.username };
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
 * @param {string} req.params.username - The email of the user.
 * @param {string} req.params.movieId - The id of the movie to be removed.
 * @returns {object} The updated user information.
 */
app.delete('/users/:username/movies/:movieId/favorite', passport.authenticate('jwt', { session: false }), async (req, res) => {
	// CONDITION TO CHECK ADDED HERE
	if (req.user.Username !== req.params.Username) {
		return res.status(400).send('Permission denied');
	}
	// CONDITION ENDS

	try {
		const filter = { Username: req.params.username };
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
 * @param {string} req.params.Username - The username of the user to be deleted.
 * @returns {string} Message indicating the user has been deleted.
 */
app.delete('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
	// CONDITION TO CHECK ADDED HERE
	if (req.user.Username !== req.params.Username) {
		return res.status(400).send('Permission denied');
	}
	// CONDITION ENDS

	try {
		const { username } = req.params;

		const user = Users.findOneAndDelete({ Username: username });

		if (!user) {
			res.status(404).send({ error: `${username} was not found` });
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
app.listen(8080, () => {
	console.log('Your app is listening on port 8080.');
});
