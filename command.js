window.commandForceAlbums = async (artist1, artist2) => {
    try {
        if (!window.spotifyToken) {
            window.spotifyToken = await window.getSpotifyToken();
        }

        // Fetch artists and their IDs
        const [artist1Data, artist2Data] = await Promise.all([
            fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artist1)}&type=artist`, {
                headers: { 'Authorization': 'Bearer ' + window.spotifyToken }
            }),
            fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artist2)}&type=artist`, {
                headers: { 'Authorization': 'Bearer ' + window.spotifyToken }
            })
        ]);

        const [artist1Json, artist2Json] = await Promise.all([
            artist1Data.json(),
            artist2Data.json()
        ]);

        const artist1Id = artist1Json.artists.items[0].id;
        const artist2Id = artist2Json.artists.items[0].id;

        // Get albums
        const [albums1Data, albums2Data] = await Promise.all([
            fetch(`https://api.spotify.com/v1/artists/${artist1Id}/albums?include_groups=album`, {
                headers: { 'Authorization': 'Bearer ' + window.spotifyToken }
            }),
            fetch(`https://api.spotify.com/v1/artists/${artist2Id}/albums?include_groups=album`, {
                headers: { 'Authorization': 'Bearer ' + window.spotifyToken }
            })
        ]);

        const [albums1Json, albums2Json] = await Promise.all([
            albums1Data.json(),
            albums2Data.json()
        ]);

        // Get random albums and their full details
        const album1 = albums1Json.items[Math.floor(Math.random() * albums1Json.items.length)];
        const album2 = albums2Json.items[Math.floor(Math.random() * albums2Json.items.length)];

        const [album1Details, album2Details] = await Promise.all([
            fetch(`https://api.spotify.com/v1/albums/${album1.id}`, {
                headers: { 'Authorization': 'Bearer ' + window.spotifyToken }
            }),
            fetch(`https://api.spotify.com/v1/albums/${album2.id}`, {
                headers: { 'Authorization': 'Bearer ' + window.spotifyToken }
            })
        ]);

        const [album1Data, album2Data] = await Promise.all([
            album1Details.json(),
            album2Details.json()
        ]);

        // Calculate album streams based on track popularity and album age
        const calculateAlbumStreams = (albumData, artistPopularity) => {
            // Get album age in months (capped at 60 months/5 years for older albums)
            const releaseDate = new Date(albumData.release_date);
            const today = new Date();
            const albumAgeMonths = Math.min(60, Math.max(1, Math.floor((today - releaseDate) / (1000 * 60 * 60 * 24 * 30))));
            
            // Base monthly streams based on artist popularity (higher popularity = more streams)
            const monthlyBaseStreams = Math.pow(artistPopularity, 1.5) * 10000;
            
            // Album popularity factor (1-100 scale)
            const albumPopularityFactor = albumData.popularity / 50;
            
            // Track count factor (more tracks = more total streams)
            const trackCount = albumData.tracks.items.length;
            
            // Calculate total streams
            // Formula: monthly streams × months × album popularity × track count
            const totalStreams = monthlyBaseStreams * albumAgeMonths * albumPopularityFactor * trackCount;
            
            return Math.floor(totalStreams);
        };

        // Get all tracks for each album with their individual popularity scores
        const getAlbumStreams = async (albumId) => {
            try {
                // First get all tracks from the album
                const albumTracksResponse = await fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`, {
                    headers: { 'Authorization': 'Bearer ' + window.spotifyToken }
                });
                const albumTracksData = await albumTracksResponse.json();
                
                // Then get detailed info for each track including popularity
                const trackIds = albumTracksData.items.map(track => track.id);
                
                // Spotify API limits to 50 IDs per request, so chunk if needed
                const chunks = [];
                for (let i = 0; i < trackIds.length; i += 20) {
                    chunks.push(trackIds.slice(i, i + 20));
                }
                
                let totalStreams = 0;
                
                // Process each chunk
                for (const chunk of chunks) {
                    const tracksResponse = await fetch(`https://api.spotify.com/v1/tracks?ids=${chunk.join(',')}`, {
                        headers: { 'Authorization': 'Bearer ' + window.spotifyToken }
                    });
                    const tracksData = await tracksResponse.json();
                    
                    // Calculate streams for each track based on popularity
                    tracksData.tracks.forEach(track => {
                        // Convert popularity to estimated streams
                        const popularity = track.popularity || 1;
                        
                        // Improved formula for more realistic stream counts
                        const trackStreams = Math.pow(10, (popularity / 15)) * 5000;
                        totalStreams += trackStreams;
                    });
                }
                
                // Add a small random factor to make it more interesting
                const randomFactor = 0.9 + (Math.random() * 0.2); // 0.9 to 1.1
                return Math.floor(totalStreams * randomFactor);
            } catch (error) {
                console.error("Error getting album streams:", error);
                // Fallback to a reasonable number if API fails
                return Math.floor(Math.random() * 50000000) + 10000000;
            }
        };

        // Get streams for both albums
        const [streams1, streams2] = await Promise.all([
            getAlbumStreams(album1.id),
            getAlbumStreams(album2.id)
        ]);

        window.currentAlbums = [{
            id: album1.id,
            title: album1.name,
            artist: artist1,
            streams: streams1,
            imageUrl: album1.images[0].url
        }, {
            id: album2.id,
            title: album2.name,
            artist: artist2,
            streams: streams2,
            imageUrl: album2.images[0].url
        }];

        // Update display
        document.getElementById('leftAlbum').src = window.currentAlbums[0].imageUrl;
        document.getElementById('rightAlbum').src = window.currentAlbums[1].imageUrl;
        document.getElementById('leftTitle').textContent = `${window.currentAlbums[0].title} by ${window.currentAlbums[0].artist}`;
        document.getElementById('rightTitle').textContent = `${window.currentAlbums[1].title} by ${window.currentAlbums[1].artist}`;

    } catch (error) {
        console.error('Error forcing albums:', error);
    }
};

// Add mobile-friendly CSS
window.applyMobileCSS = () => {
    // Check if we're on a mobile device
    const isMobile = window.innerWidth <= 768;
    
    // Only apply mobile styles on mobile devices
    if (isMobile) {
        // Create a style element if it doesn't exist
        let mobileStyle = document.getElementById('mobile-styles');
        if (!mobileStyle) {
            mobileStyle = document.createElement('style');
            mobileStyle.id = 'mobile-styles';
            document.head.appendChild(mobileStyle);
        }
        
        // Add mobile-specific CSS
        mobileStyle.textContent = `
            .game-container {
                flex-direction: column !important;
                height: auto !important;
                padding: 10px !important;
            }
            
            .album-container {
                width: 90% !important;
                margin: 10px auto !important;
            }
            
            .album-image {
                width: 100% !important;
                height: auto !important;
                max-height: 40vh !important;
                object-fit: contain !important;
            }
            
            .album-title {
                font-size: 16px !important;
                margin: 5px 0 !important;
            }
            
            .score-display {
                font-size: 18px !important;
                margin: 10px 0 !important;
            }
            
            .button-container {
                flex-direction: column !important;
                width: 100% !important;
            }
            
            button {
                margin: 5px 0 !important;
                padding: 12px !important;
                width: 100% !important;
                font-size: 16px !important;
            }
            
            .streak-container {
                margin-top: 10px !important;
                font-size: 16px !important;
            }
        `;
    } else {
        // Remove mobile styles if we're on desktop
        const mobileStyle = document.getElementById('mobile-styles');
        if (mobileStyle) {
            mobileStyle.remove();
        }
    }
};

// Call the function on page load and window resize
window.addEventListener('load', window.applyMobileCSS);
window.addEventListener('resize', window.applyMobileCSS);

// Usage in console:
// commandForceAlbums('Drake', 'Kendrick Lamar')