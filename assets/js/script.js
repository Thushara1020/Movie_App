class MovieApp {
    constructor() {
        this.apiKey = '89d7f57b';
        this.baseUrl = 'https://www.omdbapi.com/';
        this.currentPage = 1;
        this.currentSearch = '';
        this.currentSearchType = '';

        this.topRatedMovies = [
            'tt0111161', 'tt0068646', 'tt0071562', 'tt0468569', 'tt0050083',
            'tt0108052', 'tt0167260', 'tt0110912', 'tt0060196', 'tt0137523',
            'tt0120737', 'tt0109830', 'tt0080684', 'tt1375666', 'tt0167261'
        ];
        
        this.randomMovieKeywords = [
            'batman', 'love', 'war', 'space', 'comedy', 'horror', 'action',
            'drama', 'thriller', 'adventure', 'fantasy', 'mystery', 'crime'
        ];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTopRatedMovies();
        this.setupNavigation();
    }

    setupEventListeners() {

        document.getElementById('title-search-btn').addEventListener('click', () => this.searchByTitle());
        document.getElementById('keyword-search-btn').addEventListener('click', () => this.searchByKeyword());
        document.getElementById('imdb-search-btn').addEventListener('click', () => this.searchByImdbId());

        document.getElementById('title-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchByTitle();
        });
        document.getElementById('keyword-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchByKeyword();
        });
        document.getElementById('imdb-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchByImdbId();
        });
        document.getElementById('discover-btn').addEventListener('click', () => this.discoverRandomMovie());
        document.getElementById('hero-discover-btn').addEventListener('click', () => this.discoverRandomMovie());
        document.getElementById('hero-search-btn').addEventListener('click', () => {
            document.getElementById('search').scrollIntoView({ behavior: 'smooth' });
        });
        document.getElementById('close-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('movie-modal').addEventListener('click', (e) => {
            if (e.target.id === 'movie-modal') this.closeModal();
        });
        document.getElementById('clear-results').addEventListener('click', () => this.clearResults());
        document.getElementById('load-more-btn').addEventListener('click', () => this.loadMoreResults());
        document.getElementById('mobile-menu-btn').addEventListener('click', () => this.toggleMobileMenu());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        window.addEventListener('scroll', () => {
            let current = '';
            const sections = document.querySelectorAll('section[id]');
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 100;
                if (window.pageYOffset >= sectionTop) {
                    current = section.getAttribute('id');
                }
            });
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        });
    }
    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        mobileMenu.classList.toggle('hidden');
    }
    async searchByTitle() {
        const query = document.getElementById('title-search').value.trim();
        if (!query) {
            this.showToast('Please enter a movie title', 'error');
            return;
        }

        this.currentSearch = query;
        this.currentSearchType = 'title';
        this.currentPage = 1;
        
        await this.performSearch(query, 'title');
    }

    async searchByKeyword() {
        const query = document.getElementById('keyword-search').value.trim();
        if (!query) {
            this.showToast('Please enter keywords', 'error');
            return;
        }

        this.currentSearch = query;
        this.currentSearchType = 'keyword';
        this.currentPage = 1;
        
        await this.performSearch(query, 'keyword');
    }

    async searchByImdbId() {
        const imdbId = document.getElementById('imdb-search').value.trim();
        if (!imdbId) {
            this.showToast('Please enter an IMDb ID', 'error');
            return;
        }

        this.showLoading();
        
        try {
            const movie = await this.fetchMovieById(imdbId);
            if (movie && movie.Response !== 'False') {
                this.showMovieDetails(movie);
            } else {
                this.showToast('Movie not found with this IMDb ID', 'error');
            }
        } catch (error) {
            this.showToast('Error fetching movie details', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async performSearch(query, type) {
        this.showLoading();
        
        try {
            const results = await this.fetchMovies(query, this.currentPage);
            
            if (results && results.Response !== 'False' && results.Search) {
                this.displaySearchResults(results.Search, `${type.charAt(0).toUpperCase() + type.slice(1)} Results for "${query}"`);

                const totalResults = parseInt(results.totalResults);
                const currentResults = this.currentPage * 10;
                
                if (currentResults < totalResults) {
                    document.getElementById('load-more-container').classList.remove('hidden');
                } else {
                    document.getElementById('load-more-container').classList.add('hidden');
                }
                
                this.showToast(`Found ${totalResults} results`, 'success');
            } else {
                this.showToast('No movies found', 'error');
                this.clearResults();
            }
        } catch (error) {
            this.showToast('Error searching for movies', 'error');
            this.clearResults();
        } finally {
            this.hideLoading();
        }
    }

    async loadMoreResults() {
        if (!this.currentSearch) return;
        
        this.currentPage++;
        this.showLoading();
        
        try {
            const results = await this.fetchMovies(this.currentSearch, this.currentPage);
            
            if (results && results.Response !== 'False' && results.Search) {
                this.appendSearchResults(results.Search);

                const totalResults = parseInt(results.totalResults);
                const currentResults = this.currentPage * 10;
                
                if (currentResults >= totalResults) {
                    document.getElementById('load-more-container').classList.add('hidden');
                    this.showToast('No more results to load', 'warning');
                }
            }
        } catch (error) {
            this.showToast('Error loading more results', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async discoverRandomMovie() {
        const randomKeyword = this.randomMovieKeywords[Math.floor(Math.random() * this.randomMovieKeywords.length)];
        
        this.showLoading();
        
        try {
            const results = await this.fetchMovies(randomKeyword, 1);
            
            if (results && results.Response !== 'False' && results.Search && results.Search.length > 0) {
                const randomMovie = results.Search[Math.floor(Math.random() * results.Search.length)];
                const movieDetails = await this.fetchMovieById(randomMovie.imdbID);
                
                if (movieDetails && movieDetails.Response !== 'False') {
                    this.showMovieDetails(movieDetails);
                    this.showToast('Discovered a random movie for you!', 'success');
                } else {
                    this.showToast('Error loading movie details', 'error');
                }
            } else {
                this.showToast('Could not discover a movie right now', 'error');
            }
        } catch (error) {
            this.showToast('Error discovering movie', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadTopRatedMovies() {
        const topRatedGrid = document.getElementById('top-rated-grid');
        topRatedGrid.innerHTML = this.createLoadingCards(8);
        
        try {
            const moviePromises = this.topRatedMovies.slice(0, 8).map(id => this.fetchMovieById(id));
            const movies = await Promise.all(moviePromises);
            
            const validMovies = movies.filter(movie => movie && movie.Response !== 'False');
            
            if (validMovies.length > 0) {
                topRatedGrid.innerHTML = validMovies.map(movie => this.createMovieCard(movie)).join('');
                this.attachMovieCardListeners();
            } else {
                topRatedGrid.innerHTML = '<p class="col-span-full text-center text-gray-400">Unable to load top rated movies</p>';
            }
        } catch (error) {
            topRatedGrid.innerHTML = '<p class="col-span-full text-center text-gray-400">Error loading top rated movies</p>';
        }
    }

    async fetchMovies(query, page = 1) {
        if (this.apiKey === 'YOUR_OMDB_API_KEY') {
   
            return this.getDemoSearchResults(query);
        }
        
        const url = `${this.baseUrl}?apikey=${this.apiKey}&s=${encodeURIComponent(query)}&page=${page}`;
        const response = await fetch(url);
        return await response.json();
    }

    async fetchMovieById(imdbId) {
        if (this.apiKey === 'YOUR_OMDB_API_KEY') {

            return this.getDemoMovieDetails(imdbId);
        }
        
        const url = `${this.baseUrl}?apikey=${this.apiKey}&i=${imdbId}&plot=full`;
        const response = await fetch(url);
        return await response.json();
    }

    getDemoSearchResults(query) {

        const demoMovies = [
            {
                Title: "The Dark Knight",
                Year: "2008",
                imdbID: "tt0468569",
                Type: "movie",
                Poster: "https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=300&h=450&fit=crop"
            },
            {
                Title: "Inception",
                Year: "2010",
                imdbID: "tt1375666",
                Type: "movie",
                Poster: "https://images.pexels.com/photos/7991678/pexels-photo-7991678.jpeg?auto=compress&cs=tinysrgb&w=300&h=450&fit=crop"
            },
            {
                Title: "Interstellar",
                Year: "2014",
                imdbID: "tt0816692",
                Type: "movie",
                Poster: "https://images.pexels.com/photos/7991580/pexels-photo-7991580.jpeg?auto=compress&cs=tinysrgb&w=300&h=450&fit=crop"
            }
        ];
        
        return {
            Search: demoMovies,
            totalResults: "3",
            Response: "True"
        };
    }

    getDemoMovieDetails(imdbId) {

        const demoDetails = {
            "tt0468569": {
                Title: "The Dark Knight",
                Year: "2008",
                Rated: "PG-13",
                Released: "18 Jul 2008",
                Runtime: "152 min",
                Genre: "Action, Crime, Drama",
                Director: "Christopher Nolan",
                Writer: "Jonathan Nolan, Christopher Nolan, David S. Goyer",
                Actors: "Christian Bale, Heath Ledger, Aaron Eckhart",
                Plot: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
                Language: "English, Mandarin",
                Country: "United States, United Kingdom",
                Awards: "Won 2 Oscars. 159 wins & 163 nominations total",
                Poster: "https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=300&h=450&fit=crop",
                Ratings: [
                    { Source: "Internet Movie Database", Value: "9.0/10" },
                    { Source: "Rotten Tomatoes", Value: "94%" },
                    { Source: "Metacritic", Value: "84/100" }
                ],
                Metascore: "84",
                imdbRating: "9.0",
                imdbVotes: "2,558,416",
                imdbID: "tt0468569",
                Type: "movie",
                DVD: "09 Dec 2008",
                BoxOffice: "$534,858,444",
                Production: "Warner Bros. Pictures",
                Website: "N/A",
                Response: "True"
            }
        };
        
        return demoDetails[imdbId] || {
            Title: "Demo Movie",
            Year: "2023",
            Genre: "Demo",
            Director: "Demo Director",
            Actors: "Demo Actor 1, Demo Actor 2",
            Plot: "This is a demo movie for testing purposes. Replace the API key to get real movie data.",
            Poster: "https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=300&h=450&fit=crop",
            imdbRating: "8.5",
            Response: "True"
        };
    }

    displaySearchResults(movies, title) {
        const resultsSection = document.getElementById('results-section');
        const resultsTitle = document.getElementById('results-title');
        const resultsGrid = document.getElementById('results-grid');
        
        resultsTitle.textContent = title;
        resultsGrid.innerHTML = movies.map(movie => this.createMovieCard(movie)).join('');
        resultsSection.classList.remove('hidden');
        
        this.attachMovieCardListeners();

        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    appendSearchResults(movies) {
        const resultsGrid = document.getElementById('results-grid');
        const newCards = movies.map(movie => this.createMovieCard(movie)).join('');
        resultsGrid.insertAdjacentHTML('beforeend', newCards);
        this.attachMovieCardListeners();
    }

    createMovieCard(movie) {
        const poster = movie.Poster && movie.Poster !== 'N/A' 
            ? movie.Poster 
            : 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=300&h=450&fit=crop';
        
        return `
            <div class="movie-card" data-imdb-id="${movie.imdbID}">
                <div class="relative overflow-hidden">
                    <img src="${poster}" alt="${movie.Title}" class="movie-poster" loading="lazy">
                    <div class="absolute top-2 right-2">
                        <span class="movie-type">${movie.Type}</span>
                    </div>
                </div>
                <div class="movie-info">
                    <h3 class="movie-title">${movie.Title}</h3>
                    <p class="movie-year">${movie.Year}</p>
                </div>
            </div>
        `;
    }

    createLoadingCards(count) {
        return Array(count).fill().map(() => `
            <div class="loading-card h-80 rounded-lg"></div>
        `).join('');
    }

    attachMovieCardListeners() {
        const movieCards = document.querySelectorAll('.movie-card');
        movieCards.forEach(card => {
            card.addEventListener('click', async () => {
                const imdbId = card.dataset.imdbId;
                await this.loadMovieDetails(imdbId);
            });
        });
    }
    async loadMovieDetails(imdbId) {
        this.showLoading();
        
        try {
            const movie = await this.fetchMovieById(imdbId);
            if (movie && movie.Response !== 'False') {
                this.showMovieDetails(movie);
            } else {
                this.showToast('Error loading movie details', 'error');
            }
        } catch (error) {
            this.showToast('Error loading movie details', 'error');
        } finally {
            this.hideLoading();
        }
    }
    showMovieDetails(movie) {
        const modal = document.getElementById('movie-modal');
        const detailsContainer = document.getElementById('movie-details');
        
        const poster = movie.Poster && movie.Poster !== 'N/A' 
            ? movie.Poster 
            : 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=300&h=450&fit=crop';
        
        const rating = movie.imdbRating && movie.imdbRating !== 'N/A' ? movie.imdbRating : 'N/A';
        const genres = movie.Genre ? movie.Genre.split(', ').map(genre => 
            `<span class="genre-tag">${genre}</span>`
        ).join('') : '';
        
        detailsContainer.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-1">
                    <img src="${poster}" alt="${movie.Title}" class="modal-poster w-full">
                    <div class="mt-4 text-center">
                        <div class="rating-badge">
                            <i class="fas fa-star"></i>
                            <span>${rating}/10</span>
                        </div>
                    </div>
                </div>
                <div class="lg:col-span-2 space-y-6">
                    <div>
                        <h1 class="text-3xl font-bold mb-2">${movie.Title}</h1>
                        <div class="flex flex-wrap items-center gap-4 text-gray-300 mb-4">
                            <span>${movie.Year}</span>
                            <span>•</span>
                            <span>${movie.Runtime || 'N/A'}</span>
                            <span>•</span>
                            <span>${movie.Rated || 'N/A'}</span>
                        </div>
                        <div class="mb-4">
                            ${genres}
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="detail-item">
                            <div class="detail-label">Director</div>
                            <div class="detail-value">${movie.Director || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Released</div>
                            <div class="detail-value">${movie.Released || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Box Office</div>
                            <div class="detail-value">${movie.BoxOffice || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">IMDb Votes</div>
                            <div class="detail-value">${movie.imdbVotes || 'N/A'}</div>
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="detail-label">Cast</div>
                        <div class="detail-value">${movie.Actors || 'N/A'}</div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="detail-label">Plot</div>
                        <div class="detail-value">${movie.Plot || 'No plot available.'}</div>
                    </div>
                    
                    ${movie.Awards && movie.Awards !== 'N/A' ? `
                        <div class="detail-item">
                            <div class="detail-label">Awards</div>
                            <div class="detail-value">${movie.Awards}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    closeModal() {
        const modal = document.getElementById('movie-modal');
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    clearResults() {
        const resultsSection = document.getElementById('results-section');
        const resultsGrid = document.getElementById('results-grid');
        const loadMoreContainer = document.getElementById('load-more-container');
        
        resultsSection.classList.add('hidden');
        resultsGrid.innerHTML = '';
        loadMoreContainer.classList.add('hidden');
        
        this.currentSearch = '';
        this.currentSearchType = '';
        this.currentPage = 1;
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showToast(message, type = 'success', duration = 3000) {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 
                    'exclamation-triangle';
        
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${icon} mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, duration);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MovieApp();
});