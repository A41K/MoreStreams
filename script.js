let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let currentAlbums = [];

document.getElementById('highScore').textContent = highScore;

// Add this array at the top with other variables
const SELECTED_ARTISTS = [
    'Kendrick Lamar', 'SZA', 'Taylor Swift', 'Drake', 'Billie Eilish',
    'J. Cole', 'Sabrina Carpenter', 'Travis Scott', 'Ariana Grande', 'Future',
    'Olivia Rodrigo', 'Dua Lipa', 'Daniel Caesar', 'Charlie Puth',
    'JPEGMAFIA', 'JAY Z', 'Childish Gambino', 'Metro Boomin', 'Doechii',
    'Tyler, The Creator', 'Frank Ocean', 'Mac DeMarco', 'Beabadoobee', 'Mac Miller',
    'Chief Keef', 'Lil Tecca'
];

// Replace streaming data with Spotify credentials
const SPOTIFY_CONFIG = {
    CLIENT_ID: 'e36f5275303447869ebaa7a07f26f5c5',
    CLIENT_SECRET: '1e216a288be74661a98cfbc97e74d9ae'
};

// Add Spotify token management
let spotifyToken = '';

async function getSpotifyToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(SPOTIFY_CONFIG.CLIENT_ID + ':' + SPOTIFY_CONFIG.CLIENT_SECRET)
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    return data.access_token;
}

// Update fetchAlbums function
async function fetchAlbums() {
    showLoading(true);
    showError(false);
    
    try {
        if (!spotifyToken) {
            spotifyToken = await getSpotifyToken();
        }

        // Select random artists and get their data
        const artist1 = SELECTED_ARTISTS[Math.floor(Math.random() * SELECTED_ARTISTS.length)];
        let artist2;
        do {
            artist2 = SELECTED_ARTISTS[Math.floor(Math.random() * SELECTED_ARTISTS.length)];
        } while (artist2 === artist1);

        // Get artists data
        const [artist1Data, artist2Data] = await Promise.all([
            fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artist1)}&type=artist`, {
                headers: { 'Authorization': 'Bearer ' + spotifyToken }
            }),
            fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artist2)}&type=artist`, {
                headers: { 'Authorization': 'Bearer ' + spotifyToken }
            })
        ]);

        const [artist1Json, artist2Json] = await Promise.all([
            artist1Data.json(),
            artist2Data.json()
        ]);

        // Get albums
        const [albums1Data, albums2Data] = await Promise.all([
            fetch(`https://api.spotify.com/v1/artists/${artist1Json.artists.items[0].id}/albums?include_groups=album`, {
                headers: { 'Authorization': 'Bearer ' + spotifyToken }
            }),
            fetch(`https://api.spotify.com/v1/artists/${artist2Json.artists.items[0].id}/albums?include_groups=album`, {
                headers: { 'Authorization': 'Bearer ' + spotifyToken }
            })
        ]);

        const [albums1Json, albums2Json] = await Promise.all([
            albums1Data.json(),
            albums2Data.json()
        ]);

        // Get random albums
        const album1 = albums1Json.items[Math.floor(Math.random() * albums1Json.items.length)];
        const album2 = albums2Json.items[Math.floor(Math.random() * albums2Json.items.length)];

        // Get all tracks for each album
        const [tracks1Data, tracks2Data] = await Promise.all([
            fetch(`https://api.spotify.com/v1/albums/${album1.id}/tracks?limit=50`, {
                headers: { 'Authorization': 'Bearer ' + spotifyToken }
            }),
            fetch(`https://api.spotify.com/v1/albums/${album2.id}/tracks?limit=50`, {
                headers: { 'Authorization': 'Bearer ' + spotifyToken }
            })
        ]);

        const [tracksData1, tracksData2] = await Promise.all([
            tracks1Data.json(),
            tracks2Data.json()
        ]);

        // Fetch individual track details to get popularity
        const fetchTrackDetails = async (trackIds) => {
            const response = await fetch(`https://api.spotify.com/v1/tracks?ids=${trackIds.join(',')}`, {
                headers: { 'Authorization': 'Bearer ' + spotifyToken }
            });
            return response.json();
        };

        const tracks1Details = await fetchTrackDetails(tracksData1.items.map(track => track.id));
        const tracks2Details = await fetchTrackDetails(tracksData2.items.map(track => track.id));

        // Calculate streams based on all tracks in the album
        const calculateAlbumStreams = (albumData, tracksDetails) => {
            const trackStreams = tracksDetails.tracks.reduce((total, track) => {
                const trackPopularity = track.popularity || 50;
                return total + (trackPopularity * 1000000);
            }, 0);
            
            return Math.floor(trackStreams);
        };

        return [{
            id: album1.id,
            title: album1.name,
            artist: artist1,
            streams: calculateAlbumStreams(album1, tracks1Details),
            imageUrl: album1.images[0].url
        }, {
            id: album2.id,
            title: album2.name,
            artist: artist2,
            streams: calculateAlbumStreams(album2, tracks2Details),
            imageUrl: album2.images[0].url
        }];

    } catch (error) {
        console.error('Error fetching albums:', error);
        if (error.status === 401) {
            spotifyToken = '';
            return fetchAlbums();
        }
        showError(true);
        return null;
    } finally {
        showLoading(false);
    }
}

async function updateDisplay() {
    const albums = await fetchAlbums();
    if (!albums) return;
    
    currentAlbums = albums;
    
    document.getElementById('leftAlbum').src = currentAlbums[0].imageUrl;
    document.getElementById('rightAlbum').src = currentAlbums[1].imageUrl;
    document.getElementById('leftTitle').textContent = `${currentAlbums[0].title} by ${currentAlbums[0].artist}`;
    document.getElementById('rightTitle').textContent = `${currentAlbums[1].title} by ${currentAlbums[1].artist}`;
}

function showLoading(show) {
    document.getElementById('loading').classList.toggle('hidden', !show);
    document.getElementById('gameContainer').classList.toggle('hidden', show);
}

function showError(show) {
    document.getElementById('error').classList.toggle('hidden', !show);
    document.getElementById('gameContainer').classList.toggle('hidden', show);
}

async function updateDisplay() {
    const albums = await fetchAlbums();
    if (!albums) return;
    
    const shuffled = albums.sort(() => 0.5 - Math.random());
    currentAlbums = shuffled.slice(0, 2);
    
    document.getElementById('leftAlbum').src = currentAlbums[0].imageUrl;
    document.getElementById('rightAlbum').src = currentAlbums[1].imageUrl;
    document.getElementById('leftTitle').textContent = `${currentAlbums[0].title} by ${currentAlbums[0].artist}`;
    document.getElementById('rightTitle').textContent = `${currentAlbums[1].title} by ${currentAlbums[1].artist}`;
}

// Add this at the top with other state variables
let isChoiceLocked = false;

// Modify the makeChoice function
function makeChoice(choice) {
    if (isChoiceLocked) return; // Prevent multiple choices
    isChoiceLocked = true;
    
    const leftStreams = currentAlbums[0].streams;
    const rightStreams = currentAlbums[1].streams;
    
    const leftAlbum = document.querySelector('.album.left');
    const rightAlbum = document.querySelector('.album.right');
    
    // Format streams in millions/billions
    const formatStreams = (streams) => {
        if (streams >= 1000000000) {
            return (streams / 1000000000).toFixed(2) + 'B';
        }
        return (streams / 1000000).toFixed(2) + 'M';
    };
    
    document.getElementById('leftTitle').textContent += `\nStreams: ${formatStreams(leftStreams)}`;
    document.getElementById('rightTitle').textContent += `\nStreams: ${formatStreams(rightStreams)}`;
    
    let correct = false;
    if (choice === 'left' && leftStreams > rightStreams) correct = true;
    if (choice === 'right' && rightStreams > leftStreams) correct = true;
    
    if (correct) {
        score++;
        document.getElementById('score').textContent = score;
        
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
            document.getElementById('highScore').textContent = highScore;
        }
        
        choice === 'left' ? leftAlbum.classList.add('correct') : rightAlbum.classList.add('correct');
    } else {
        choice === 'left' ? leftAlbum.classList.add('incorrect') : rightAlbum.classList.add('incorrect');
    }
    
    setTimeout(() => {
        leftAlbum.classList.remove('correct', 'incorrect');
        rightAlbum.classList.remove('correct', 'incorrect');
        updateDisplay();
        isChoiceLocked = false; // Re-enable choices for next round
    }, 2000); // Increased timeout to give more time to read the stream counts
}

async function retryFetch() {
    await updateDisplay();
}

// Initialize the game
window.onload = updateDisplay;