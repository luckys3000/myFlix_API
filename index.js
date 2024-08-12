const express = require("express"),
	morgan = require("morgan"),
	bodyParser = require("body-parser"),
	uuid = require("uuid"),
	app = express("express");

app.use(bodyParser.json());

//Morgan invoked specifying requests logged using "common" format
app.use(morgan("common"));

//Express.static to serve documentation file from public folder
app.use(express.static("public"));

let users = [
	{
		id: 1,
		name: "Jeffrey",
		favoriteMovies: [],
	},
	{
		id: 2,
		name: "James",
		favoriteMovies: [],
	},
];

let movies = [
	{
		Title: "The Silence of the Lambs",
		Plot: "A young F.B.I. cadet must receive the help of an incarcerated and manipulative cannibal killer to help catch another serial killer, a madman who skins his victims.",
		Genre: {
			Name: "Thriller",
			Description:
				"Thriller is a genre of fiction with numerous, often overlapping, subgenres, including crime, horror, and detective fiction. Thrillers are characterized and defined by the moods they elicit, giving their audiences heightened feelings of suspense, excitement, surprise, anticipation and anxiety.",
		},
		Director: {
			Name: "Jonathan Demme",
			Bio: "Robert Jonathan Demme was an American filmmaker, whose career directing, producing, and screenwriting spanned more than 30 years and 70 feature films, documentaries, and television productions.",
			Birth: "February 22, 1944",
			Death: "April 26, 2017",
		},
		ImageURL: "https://m.media-amazon.com/images/M/MV5BNjNhZTk0ZmEtNjJhMi00YzFlLWE1MmEtYzM1M2ZmMGMwMTU4XkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg",
		Featured: false,
	},
	{
		Title: "Tombstone",
		Plot: "A successful lawman's plans to retire anonymously in Tombstone, Arizona, are disrupted by the kind of outlaws he was famous for eliminating.",
		Genre: {
			Name: "Drama",
			Description:
				"The drama genre features stories with high stakes and many conflicts. They're plot-driven and demand that every character and scene move the story forward. Dramas follow a clearly defined narrative plot structure, portraying real-life scenarios or extreme situations with emotionally-driven characters.",
		},
		Director: {
			Name: "George P. Cosmatos",
			Bio: 'George Pan Cosmatos was a Greek-Italian film director and screenwriter. Following early success in his home country with drama films such as Massacre in Rome with Richard Burton (based on the real-life Ardeatine massacre), Cosmatos retooled his career towards mainstream "blockbuster" action and adventure films, including The Cassandra Crossing and Escape to Athena, both of which were British-Italian co-productions.',
			Birth: "January 4, 1941",
			Death: "April 19, 2005",
		},
		ImageURL: "https://m.media-amazon.com/images/M/MV5BODRkYzA4MGItODE2MC00ZjkwLWI2NDEtYzU1NzFiZGU1YzA0XkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_SX300.jpg",
		Featured: false,
	},
];

//Create
app.post("/users", (req, res) => {
	const newUser = req.body;

	if (newUser.name) {
		newUser.id = uuid.v4();
		users.push(newUser);
		res.status(201).json(newUser);
	} else {
		res.status(400).send("users need names");
	}
});

//Create
app.post("/users/:id/:movieTitle", (req, res) => {
	const { id, movieTitle } = req.params;

	let user = users.find((user) => user.id == id);

	if (user) {
		user.favoriteMovies.push(movieTitle);
		res.status(201).send(`${movieTitle} has been added to user ${id}'s favorites.`);
	} else {
		res.status(400).send("no such user");
	}
});

//GET requests
app.get("/", (req, res) => {
	res.send("Welcome to myFlix API!");
});

//Read
app.get("/movies", (req, res) => {
	res.status(200).json(movies);
});

//Read
app.get("/movies/:title", (req, res) => {
	const { title } = req.params;
	const movie = movies.find((movie) => movie.Title === title);

	if (movie) {
		res.status(200).json(movie);
	} else {
		res.status(400).send("no such movie");
	}
});

//Read
app.get("/movies/genre/:genreName", (req, res) => {
	const { genreName } = req.params;
	const genre = movies.find((movie) => movie.Genre.Name === genreName).Genre;

	if (genre) {
		res.status(200).json(genre);
	} else {
		res.staus(400).send("no such genre");
	}
});

//Read
app.get("/movies/directors/:directorName", (req, res) => {
	const { directorName } = req.params;
	const director = movies.find((movie) => movie.Director.Name === directorName).Director;

	if (director) {
		res.status(200).json(director);
	} else {
		res.staus(400).send("no such director");
	}
});

//Update
app.put("/users/:id", (req, res) => {
	const { id } = req.params;
	const updateUser = req.body;

	let user = users.find((user) => user.id == id);

	if (user) {
		user.name = updateUser.name;
		res.status(200).json(user);
	} else {
		res.status(400).send("no such user");
	}
});

//Delete
app.delete("/users/:id/:movieTitle", (req, res) => {
	const { id, movieTitle } = req.params;

	let user = users.find((user) => user.id == id);

	if (user) {
		user.favoriteMovies = user.favoriteMovies.filter((title) => title !== movieTitle);
		res.status(200).send(`${movieTitle} has been removed from user ${id}'s favorites.`);
	} else {
		res.status(400).send("no such user");
	}
});

//Delete user
app.delete("/users/:id", (req, res) => {
	const { id } = req.params;

	let user = users.find((user) => user.id == id);

	if (user) {
		users = users.filter((user) => user.id != id);
		res.status(200).send(`User ${id} has been deleted`);
	}
});

app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send("Something broke!");
});

//listen for requests
app.listen(8080, () => {
	console.log("Your app is listening on port 8080.");
});
