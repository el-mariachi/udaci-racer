// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
const store = {
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
	onPageLoad()
	setupClickHandlers()
})

async function onPageLoad() {
	try {
		Promise.all([getTracks(), getRacers()])
			.then(([tracks, racers]) => {
				renderAt('#tracks', renderTrackCards(tracks));
				renderAt('#racers', renderRacerCars(racers));
			})
	} catch (error) {
		console.log("Problem getting tracks and racers ::", error.message)
		console.error(error)
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function (event) {
		const { target } = event;

		// Race track form field
		if (target.matches('.card.track')) {
			handleSelectTrack(target);
		} else if (target.parentNode.matches('.card.track')) {
			handleSelectTrack(target.parentNode);
		}

		// Podracer form field
		if (target.matches('.card.podracer')) {
			handleSelectPodRacer(target);
		} else if (target.parentNode.matches('.card.podracer')) {
			handleSelectPodRacer(target.parentNode);
		}

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault()

			// start race
			handleCreateRace();
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate(target)
		}

	}, false)
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch (error) {
		console.log("an error shouldn't be possible here")
		console.log(error)
	}
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
	// render starting UI
	renderAt('#race', renderRaceStartView(store.track))
	try {
		// invoke the API call to create the race, then save the result
		const race = await createRace(store.player_id, store.track_id);
		// update the store with the race id
		Object.assign(store, { race_id: parseInt(race.ID) - 1 }); // - 1 is an undocumented bug. found solution in peer chat
		// The race has been created, now start the countdown
		// call the async function runCountdown
		await runCountdown();
		// call the async function startRace
		await startRace(store.race_id);
		// call the async function runRace
		runRace(store.race_id);
	} catch (err) {
		console.log('There was a problem running the race');
		console.log('Error:', err);
		renderAt('#race', `<header><h1>Error running the race</h1></header>`)
	}
}

function runRace(raceID) {
	let raceRef;
	return new Promise(resolve => {
		// use Javascript's built in setInterval method to get race info every 500ms
		raceRef = setInterval(() => {
			const race = getRace(raceID).then(raceData => {
				switch (raceData.status) {
					case 'in-progress':
						renderAt('#leaderBoard', raceProgress(raceData.positions)); // update the leaderboard
						break;
					case 'finished':
						clearInterval(raceRef); // stop the interval from repeating
						renderAt('#race', resultsView(raceData.positions)); // render the results view
						resolve(race); // resolve the promise
					default:
						resolve(undefined);
						break;
				}
			}).catch(err => {
				clearInterval(raceRef);
				console.log('There was an error running the race.');
				console.log('Error:', err);
			});
		}, 500);
	});
	// remember to add error handling for the Promise
}

async function runCountdown() {
	try {
		// wait for the DOM to load
		await delay(1000);
		let timer = 3

		return new Promise(resolve => {
			// use Javascript's built in setInterval method to count down once per second
			const ref = setInterval(() => {
				// run this DOM manipulation to decrement the countdown for the user
				document.getElementById('big-numbers').innerHTML = --timer
				// if the countdown is done, clear the interval, resolve the promise, and return
				if (timer <= 0) {
					clearInterval(ref);
					resolve();
				}
			}, 1000);
		})
	} catch (error) {
		console.log(error);
	}
}

function handleSelectPodRacer(target) {
	console.log("selected a pod", target.id);

	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected')
	if (selected) {
		selected.classList.remove('selected');
	}

	// add class selected to current target
	target.classList.add('selected');

	// save the selected racer to the store
	store.player_id = parseInt(target.id);
}

function handleSelectTrack(target) {
	console.log("selected a track", target.id)

	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected')
	if (selected) {
		selected.classList.remove('selected');
	}

	// add class selected to current target
	target.classList.add('selected');

	// save the selected track id to the store
	Object.assign(store, { track: { id: parseInt(target.id), name: target.dataset.name } });
	store.track_id = parseInt(target.id);
}

function handleAccelerate() {
	// Invoke the API call to accelerate
	accelerate(store.race_id);
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</h4>
		`
	}

	return racers.map(renderRacerCard).join('');
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer

	return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>Top Speed: ${top_speed}</p>
			<p>Accel: ${acceleration}</p>
			<p>Handling: ${handling}</p>
		</li>
	`
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</h4>
		`
	}

	return tracks.map(renderTrackCard).join('');

}

function renderTrackCard(track) {
	const { id, name } = track

	return `
		<li id="${id}" class="card track" data-name="${name}">
			<h3>${name}</h3>
		</li>
	`
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceStartView(track, racers) {
	return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1)

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`
}

function raceProgress(positions) {
	const userPlayer = positions.find(e => e.id === store.player_id)
	userPlayer.driver_name += " (you)"

	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
	let count = 1

	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
	})

	return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`
}

function renderAt(element, html) {
	const node = document.querySelector(element)

	node.innerHTML = html
}

// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:8000'

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': SERVER,
		},
	}
}

// Make a fetch call (with error handling!) to each of the following API endpoints 

async function getTracks() {
	try {
		const trackData = await fetch(`${SERVER}/api/tracks`);
		const tracks = await trackData.json();
		return tracks;
	} catch (err) {
		console.error('A fetch error occured in function getTracks().');
		throw new Error(err);
	}
}

async function getRacers() {
	try {
		const carData = await fetch(`${SERVER}/api/cars`);
		const cars = await carData.json();

		return cars;
	} catch (err) {
		console.error('A fetch error occured in function getRacers().');
		throw new Error(err);
	}
}
/**
 * Returns a Promise with race data
 * @param {number} player_id Player ID
 * @param {number} track_id Track ID
 */
function createRace(player_id, track_id) {
	player_id = parseInt(player_id);
	track_id = parseInt(track_id);
	const body = { player_id, track_id };

	return fetch(`${SERVER}/api/races`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'jsonp',
		body: JSON.stringify(body)
	})
		.then(res => res.json())
		.catch(err => console.log("Problem with createRace request::", err));
}

async function getRace(id) {
	id = parseInt(id);
	try {
		const race = await fetch(`${SERVER}/api/races/${id}`);
		return await race.json();
	} catch (err) {
		console.log('Error getting current race data (in function getRace).');
		throw new Error(err);
	}
}
/**
 * 
 * @param {number} id 
 * @returns {undefined} Nothing
 */
function startRace(id) {
	return fetch(`${SERVER}/api/races/${id}/start`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
		// .then(res => res.json())
		.catch(err => console.log("Problem with getRace request::", err));
}

function accelerate(id) {
	id = parseInt(id);
	try {
		fetch(`${SERVER}/api/races/${id}/accelerate`, {
			method: "POST",
			...defaultFetchOpts()
		});
	} catch (err) {
		console.log('Out of fuel:', err);
	}
}
