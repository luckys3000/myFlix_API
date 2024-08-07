const express = require('express');
morgan = require('morgan');

const app = express();

//Morgan invoked specifying requests logged using "common" format
app.use(morgan('common'));

//Express.static to serve documentation file from public folder
app.use(express.static('public'));

const topMovies = [
	{
		title: 'The Silence of the Lambs',
		director: 'Jonathan Demme',
	},
	{
		title: 'Tombstone',
		director: 'George P. Cosmatos',
	},
	{
		title: 'The Bourne Identity',
		director: 'Doug Liman',
	},
	{
		title: 'E.T.',
		director: 'Steven Spielberg',
	},
	{
		title: 'The Goonies',
		director: 'Steven Spielberg',
	},
	{
		title: 'Star Wars: Return of the Jedi',
		director: 'Richar Marquand',
	},
	{
		title: 'Caddyshack',
		director: 'Harold Ramis',
	},
	{
		title: 'Good Will Hunting',
		director: 'Gus Van Sant',
	},
	{
		title: 'The Matrix',
		director: 'Lana Wachowski, Lilly Wachowski',
	},
	{
		title: 'The Sound of Music',
		director: 'Robert Wise',
	},
];

//GET requests
app.get('/', (req, res) => {
	res.send('Welcome to myFlix API!');
});

app.get('/movies', (req, res) => {
	res.json(topMovies);
});

app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send('Something broke!');
});

//listen for requests
app.listen(8080, () => {
	console.log('Your app is listening on port 8080.');
});
